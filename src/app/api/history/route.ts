import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { startOfDay, endOfDay, parseISO } from "date-fns";

const salesSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: z.string().optional(),
  date: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const targetDate = dateParam ? parseISO(dateParam) : new Date();

  const sales = await prisma.salesEntry.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sales });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = salesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { amount, note, date } = parsed.data;

    const sale = await prisma.salesEntry.create({
      data: {
        userId: session.user.id,
        amount,
        note: note ?? null,
        date: date ? parseISO(date) : new Date(),
      },
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
