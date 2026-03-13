import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePhilippineMobile } from "@/lib/mobileNumber";
import {
  generatePasswordResetOtp,
  getPasswordResetExpiryDate,
  PASSWORD_RESET_MAX_REQUESTS_PER_WINDOW,
  PASSWORD_RESET_REQUEST_WINDOW_MS,
  PASSWORD_RESET_RESEND_COOLDOWN_SECONDS,
} from "@/lib/passwordReset";
import { sendPasswordResetOtpSms } from "@/lib/sms";

const requestSchema = z.object({
  mobileNumber: z.string().min(1, "Mobile number is required"),
});

const SUCCESS_MESSAGE =
  "If your mobile number is registered, we sent a reset code.";

type RequestRateState = {
  count: number;
  windowStartedAt: number;
  lastSentAt: number;
  blockedUntil: number;
};

const globalForPasswordResetRateLimit = globalThis as unknown as {
  passwordResetRequestState: Map<string, RequestRateState> | undefined;
};

const passwordResetRequestState =
  globalForPasswordResetRateLimit.passwordResetRequestState ??
  new Map<string, RequestRateState>();

if (process.env.NODE_ENV !== "production") {
  globalForPasswordResetRateLimit.passwordResetRequestState =
    passwordResetRequestState;
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function getRateKey(mobileNumber: string, request: NextRequest) {
  return `${mobileNumber}:${getClientIp(request)}`;
}

async function createOtpRequestLog(input: {
  mobileNumber: string;
  ipAddress: string;
  status: string;
  userId?: string;
}) {
  try {
    await prisma.passwordResetRequestLog.create({
      data: {
        userId: input.userId,
        mobileNumber: input.mobileNumber,
        ipAddress: input.ipAddress,
        status: input.status,
      },
    });
  } catch (error) {
    console.error("Failed to create password reset request log", error);
  }
}

function applyRequestRateLimit(key: string) {
  const now = Date.now();
  const existing = passwordResetRequestState.get(key);

  const retryFromBlock =
    existing && existing.blockedUntil > now
      ? Math.ceil((existing.blockedUntil - now) / 1000)
      : 0;

  if (retryFromBlock > 0) {
    return { ok: false as const, retryAfterSeconds: retryFromBlock };
  }

  const retryFromCooldown =
    existing && existing.lastSentAt > 0
      ? PASSWORD_RESET_RESEND_COOLDOWN_SECONDS -
        Math.floor((now - existing.lastSentAt) / 1000)
      : 0;

  if (retryFromCooldown > 0) {
    return { ok: false as const, retryAfterSeconds: retryFromCooldown };
  }

  const inSameWindow =
    existing && now - existing.windowStartedAt < PASSWORD_RESET_REQUEST_WINDOW_MS;

  const nextCount = inSameWindow ? (existing?.count ?? 0) + 1 : 1;
  const windowStartedAt = inSameWindow ? (existing?.windowStartedAt ?? now) : now;

  if (nextCount > PASSWORD_RESET_MAX_REQUESTS_PER_WINDOW) {
    const blockedUntil = now + PASSWORD_RESET_REQUEST_WINDOW_MS;
    passwordResetRequestState.set(key, {
      count: nextCount,
      windowStartedAt,
      lastSentAt: existing?.lastSentAt ?? 0,
      blockedUntil,
    });

    return {
      ok: false as const,
      retryAfterSeconds: Math.ceil(PASSWORD_RESET_REQUEST_WINDOW_MS / 1000),
    };
  }

  passwordResetRequestState.set(key, {
    count: nextCount,
    windowStartedAt,
    lastSentAt: now,
    blockedUntil: 0,
  });

  return { ok: true as const, retryAfterSeconds: 0 };
}

export async function POST(req: NextRequest) {
  const ipAddress = getClientIp(req);

  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const normalizedMobile = normalizePhilippineMobile(parsed.data.mobileNumber);
    if (!normalizedMobile) {
      await createOtpRequestLog({
        mobileNumber: parsed.data.mobileNumber.trim(),
        ipAddress,
        status: "invalid_mobile",
      });

      return NextResponse.json(
        { error: "Enter a valid Philippine mobile number" },
        { status: 400 }
      );
    }

    const rateLimitResult = applyRequestRateLimit(
      getRateKey(normalizedMobile, req)
    );

    if (!rateLimitResult.ok) {
      await createOtpRequestLog({
        mobileNumber: normalizedMobile,
        ipAddress,
        status: "rate_limited",
      });

      return NextResponse.json(
        {
          error: `Please wait ${rateLimitResult.retryAfterSeconds}s before requesting another OTP`,
          retryAfterSeconds: rateLimitResult.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { mobileNumber: normalizedMobile },
      select: { id: true },
    });

    let devOtp: string | undefined;

    if (user) {
      const otp = generatePasswordResetOtp();
      const codeHash = await bcrypt.hash(otp, 10);

      await prisma.$transaction([
        prisma.passwordResetOtp.updateMany({
          where: {
            userId: user.id,
            consumedAt: null,
          },
          data: { consumedAt: new Date() },
        }),
        prisma.passwordResetOtp.create({
          data: {
            userId: user.id,
            codeHash,
            expiresAt: getPasswordResetExpiryDate(),
          },
        }),
      ]);

      const smsResult = await sendPasswordResetOtpSms({
        mobileNumber: normalizedMobile,
        otp,
      });

      if (!smsResult.delivered && process.env.NODE_ENV !== "production") {
        devOtp = otp;
      }

      await createOtpRequestLog({
        mobileNumber: normalizedMobile,
        ipAddress,
        userId: user.id,
        status: smsResult.delivered ? "otp_sent" : "otp_not_delivered",
      });

      if (!smsResult.delivered) {
        console.warn("Password reset OTP SMS not delivered", {
          reason: smsResult.reason,
          userId: user.id,
        });
      }
    } else {
      await createOtpRequestLog({
        mobileNumber: normalizedMobile,
        ipAddress,
        status: "user_not_found",
      });
    }

    return NextResponse.json(
      {
        message: SUCCESS_MESSAGE,
        retryAfterSeconds: PASSWORD_RESET_RESEND_COOLDOWN_SECONDS,
        ...(devOtp ? { devOtp } : {}),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password request API error", error);
    // Keep response consistent to avoid account enumeration and prevent resend UX breakage.
    await createOtpRequestLog({
      mobileNumber: "unknown",
      ipAddress,
      status: "server_error",
    });

    return NextResponse.json(
      {
        message: SUCCESS_MESSAGE,
        retryAfterSeconds: PASSWORD_RESET_RESEND_COOLDOWN_SECONDS,
      },
      { status: 200 }
    );
  }
}
