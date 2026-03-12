import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { startOfDay, endOfDay, parseISO, isValid } from "date-fns";
import {
  computeDailyAmount,
  computeSpreadEndDate,
} from "@/lib/spreadExpense";

const expenseSchema = z.object({
  label: z.string().min(1, "Label is required").max(50),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().optional(),
  spreadDays: z.coerce
    .number()
    .int()
    .min(1, "Must spread across at least 1 day")
    .max(30, "Cannot spread across more than 30 days")
    .optional()
    .default(1),
});

let spreadColumnsEnsured = false;

async function ensureSpreadColumns() {
  if (spreadColumnsEnsured) return;

  // Safe self-heal for environments where migrations were not applied yet.
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Expense"
    ADD COLUMN IF NOT EXISTS "expenseType" TEXT DEFAULT 'one-time',
    ADD COLUMN IF NOT EXISTS "spreadDays" INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS "dailyAmount" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "spreadEndDate" TIMESTAMP(3)
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "Expense"
    SET
      "expenseType" = COALESCE("expenseType", 'one-time'),
      "spreadDays" = COALESCE("spreadDays", 1)
    WHERE "expenseType" IS NULL OR "spreadDays" IS NULL
  `);

  spreadColumnsEnsured = true;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const targetDate = dateParam ? parseISO(dateParam) : new Date();

  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureSpreadColumns();

    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { label, amount, date, spreadDays } = parsed.data;
    const expenseDate = date ? parseISO(date) : new Date();
    if (!isValid(expenseDate)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    let expenseType = "one-time";
    let dailyAmount: number | null = null;
    let spreadEndDate: Date | null = null;

    if (spreadDays > 1) {
      expenseType = "bulk";
      dailyAmount = computeDailyAmount(amount, spreadDays);
      spreadEndDate = computeSpreadEndDate(expenseDate, spreadDays);
    }

    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        label,
        amount,
        date: expenseDate,
        expenseType,
        spreadDays,
        dailyAmount,
        spreadEndDate,
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/expenses] Failed to create expense", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

