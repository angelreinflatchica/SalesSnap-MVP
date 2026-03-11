import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSmartSummary } from "@/lib/smartSummary";
import { endOfDay, format, parseISO, startOfDay, subDays } from "date-fns";
import { getDailySummary, upsertDailySummary } from "@/lib/dailySummaryStore";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const language = searchParams.get("lang") === "tl" ? "tl" : "en";
  const force = searchParams.get("force") === "1";
  const targetDate = dateParam ? parseISO(dateParam) : new Date();
  const previousDate = subDays(targetDate, 1);
  const dateKey = format(targetDate, "yyyy-MM-dd");

  if (!force) {
    const cached = await getDailySummary({
      userId: session.user.id,
      date: dateKey,
      language,
    });
    if (cached) {
      return NextResponse.json({
        summary: cached.summary,
        provider: cached.provider,
        fromCache: true,
        metrics: {
          date: dateKey,
          language,
        },
      });
    }
  }

  const [user, sales, expenses, previousSales, previousExpenses] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { businessName: true },
    }),
    prisma.salesEntry.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) },
      },
      select: { amount: true },
    }),
    prisma.expense.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) },
      },
      select: { label: true, amount: true },
    }),
    prisma.salesEntry.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startOfDay(previousDate), lte: endOfDay(previousDate) },
      },
      select: { amount: true },
    }),
    prisma.expense.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startOfDay(previousDate), lte: endOfDay(previousDate) },
      },
      select: { amount: true },
    }),
  ]);

  const salesRows = sales as Array<{ amount: number }>;
  const expenseRows = expenses as Array<{ label: string; amount: number }>;
  const previousSalesRows = previousSales as Array<{ amount: number }>;
  const previousExpenseRows = previousExpenses as Array<{ amount: number }>;

  const totalSales = salesRows.reduce((sum, s) => sum + s.amount, 0);
  const totalExpenses = expenseRows.reduce((sum, e) => sum + e.amount, 0);
  const profit = totalSales - totalExpenses;

  const prevSales = previousSalesRows.reduce((sum, s) => sum + s.amount, 0);
  const prevExpenses = previousExpenseRows.reduce((sum, e) => sum + e.amount, 0);
  const previousProfit = prevSales - prevExpenses;

  const topExpense = expenseRows.reduce(
    (max: { label: string | null; amount: number }, item) =>
      item.amount > max.amount ? { label: item.label, amount: item.amount } : max,
    { label: null, amount: 0 }
  );

  const generated = await generateSmartSummary({
    businessName: user?.businessName,
    language,
    dateLabel: format(targetDate, "MMMM d, yyyy"),
    totalSales,
    totalExpenses,
    profit,
    previousProfit,
    topExpenseLabel: topExpense.label,
    topExpenseAmount: topExpense.amount,
  });

  await upsertDailySummary({
    userId: session.user.id,
    date: dateKey,
    language,
    summary: generated.text,
    provider: generated.provider,
  });

  return NextResponse.json({
    summary: generated.text,
    provider: generated.provider,
    fromCache: false,
    metrics: {
      totalSales,
      totalExpenses,
      profit,
      previousProfit,
      topExpenseLabel: topExpense.label,
      topExpenseAmount: topExpense.amount,
      date: dateKey,
      language,
    },
  });
}
