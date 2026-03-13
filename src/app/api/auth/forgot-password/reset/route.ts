import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePhilippineMobile } from "@/lib/mobileNumber";
import {
  PASSWORD_RESET_ACCOUNT_LOCK_MS,
  PASSWORD_RESET_ACCOUNT_LOCK_THRESHOLD,
  PASSWORD_RESET_MAX_ATTEMPTS,
} from "@/lib/passwordReset";

const resetSchema = z.object({
  mobileNumber: z.string().min(1, "Mobile number is required"),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

function getLockRetrySeconds(lockedUntil: Date) {
  return Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / 1000));
}

async function registerPasswordResetFailure(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordResetFailureCount: true,
      passwordResetLockedUntil: true,
    },
  });

  if (!user) {
    return;
  }

  const now = new Date();
  const isLockActive =
    user.passwordResetLockedUntil && user.passwordResetLockedUntil > now;

  if (isLockActive) {
    return;
  }

  const nextFailureCount = user.passwordResetFailureCount + 1;

  if (nextFailureCount >= PASSWORD_RESET_ACCOUNT_LOCK_THRESHOLD) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetFailureCount: 0,
        passwordResetLockedUntil: new Date(Date.now() + PASSWORD_RESET_ACCOUNT_LOCK_MS),
      },
    });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetFailureCount: nextFailureCount,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const normalizedMobile = normalizePhilippineMobile(parsed.data.mobileNumber);
    if (!normalizedMobile) {
      return NextResponse.json(
        { error: "Enter a valid Philippine mobile number" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { mobileNumber: normalizedMobile },
      select: {
        id: true,
        passwordResetLockedUntil: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    if (user.passwordResetLockedUntil && user.passwordResetLockedUntil > new Date()) {
      const retryAfterSeconds = getLockRetrySeconds(user.passwordResetLockedUntil);
      return NextResponse.json(
        {
          error: `Too many failed reset attempts. Try again in ${retryAfterSeconds}s`,
          retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        consumedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      if (otpRecord?.id) {
        await prisma.passwordResetOtp.update({
          where: { id: otpRecord.id },
          data: { consumedAt: new Date() },
        });
      }

      await registerPasswordResetFailure(user.id);
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    if (otpRecord.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
      await prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { consumedAt: new Date() },
      });

      await registerPasswordResetFailure(user.id);
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const isOtpValid = await bcrypt.compare(parsed.data.otp, otpRecord.codeHash);
    if (!isOtpValid) {
      const attempts = otpRecord.attempts + 1;
      await prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: {
          attempts,
          consumedAt: attempts >= PASSWORD_RESET_MAX_ATTEMPTS ? new Date() : null,
        },
      });

      await registerPasswordResetFailure(user.id);
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetFailureCount: 0,
          passwordResetLockedUntil: null,
        },
      }),
      prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { consumedAt: new Date() },
      }),
      prisma.passwordResetOtp.updateMany({
        where: {
          userId: user.id,
          consumedAt: null,
          id: { not: otpRecord.id },
        },
        data: { consumedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message: "Password reset successful" }, { status: 200 });
  } catch (error) {
    console.error("Forgot password reset API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
