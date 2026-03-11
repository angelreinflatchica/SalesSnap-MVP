import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { normalizePhilippineMobile } from "@/lib/mobileNumber";

const registerSchema = z.object({
  mobileNumber: z.string().min(1, "Mobile number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { mobileNumber, password, businessName } = parsed.data;
    const normalizedMobile = normalizePhilippineMobile(mobileNumber);

    if (!normalizedMobile) {
      return NextResponse.json(
        { error: "Enter a valid Philippine mobile number" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { mobileNumber: normalizedMobile },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this mobile number already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        mobileNumber: normalizedMobile,
        password: hashedPassword,
        businessName: businessName ?? null,
      },
      select: { id: true, mobileNumber: true, businessName: true },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          mobileNumber: user.mobileNumber,
          businessName: user.businessName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
