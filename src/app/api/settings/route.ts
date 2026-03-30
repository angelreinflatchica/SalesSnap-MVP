import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { compare, hash } from "bcryptjs";

const settingsSchema = z
  .object({
    businessName: z.string().max(100).optional(),
    currency: z.string().length(3).optional(),
    displayName: z.string().max(60).optional(),
    tagline: z.string().max(120).optional(),
    avatarColor: z
      .string()
      .regex(/^#([0-9A-Fa-f]{6})$/, "Invalid color")
      .optional(),
    accountClaimed: z.boolean().optional(),
    currentPassword: z.string().min(8).optional(),
    newPassword: z.string().min(8).optional(),
    confirmPassword: z.string().min(8).optional(),
  })
  .superRefine((data, ctx) => {
  const hasAnyPasswordField =
    !!data.currentPassword || !!data.newPassword || !!data.confirmPassword;

  if (!hasAnyPasswordField) return;

  if (!data.currentPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Current password is required",
      path: ["currentPassword"],
    });
  }

  if (!data.newPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "New password is required",
      path: ["newPassword"],
    });
  }

  if (!data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please confirm your new password",
      path: ["confirmPassword"],
    });
  }

  if (
    data.newPassword &&
    data.confirmPassword &&
    data.newPassword !== data.confirmPassword
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "New password and confirmation do not match",
      path: ["confirmPassword"],
    });
  }
  });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      mobileNumber: true,
      businessName: true,
      currency: true,
      displayName: true,
      tagline: true,
      avatarColor: true,
      accountClaimed: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      mobileNumber: user.mobileNumber,
      businessName: user.businessName,
      currency: user.currency,
      displayName: user.displayName,
      tagline: user.tagline,
      avatarColor: user.avatarColor,
      accountClaimed: user.accountClaimed,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
      ...profileFields
    } = parsed.data;

    const updateData: {
      businessName?: string;
      currency?: string;
      displayName?: string;
      tagline?: string;
      avatarColor?: string;
      accountClaimed?: boolean;
      password?: string;
    } = {
      ...profileFields,
    };

    const wantsPasswordChange =
      !!currentPassword || !!newPassword || !!confirmPassword;

    if (wantsPasswordChange) {
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      });

      if (!existingUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isCurrentPasswordValid = await compare(
        currentPassword as string,
        existingUser.password
      );

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      updateData.password = await hash(newPassword as string, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No changes provided" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        mobileNumber: true,
        businessName: true,
        currency: true,
        displayName: true,
        tagline: true,
        avatarColor: true,
        accountClaimed: true,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        businessName: user.businessName,
        currency: user.currency,
        displayName: user.displayName,
        tagline: user.tagline,
        avatarColor: user.avatarColor,
        accountClaimed: user.accountClaimed,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
