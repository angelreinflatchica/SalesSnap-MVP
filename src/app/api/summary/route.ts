import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  subDays,
  startOfDay,
  endOfDay,
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const today = new Date();
  const yearAgo = startOfDay(subDays(today, 364));

  // Fetch all sales & expenses for the past year in two queries
  const [allSales, allExpenses] = await Promise.all([
    prisma.salesEntry.findMany({
      where: { userId, date: { gte: yearAgo, lte: endOfDay(today) } },
      select: { amount: true, date: true },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: yearAgo, lte: endOfDay(today) } },
      select: { amount: true, date: true },
    }),
  ]);

  // ── Group by day ────────────────────────────────────────────────────────────
  const dayMap = new Map<string, { sales: number; expenses: number }>();

  for (const s of allSales) {
    const key = format(new Date(s.date), "yyyy-MM-dd");
    const prev = dayMap.get(key) ?? { sales: 0, expenses: 0 };
    dayMap.set(key, { ...prev, sales: prev.sales + s.amount });
  }
  for (const e of allExpenses) {
    const key = format(new Date(e.date), "yyyy-MM-dd");
    const prev = dayMap.get(key) ?? { sales: 0, expenses: 0 };
    dayMap.set(key, { ...prev, expenses: prev.expenses + e.amount });
  }

  const days = Array.from(dayMap.entries()).map(([date, v]) => ({
    date,
    totalSales: v.sales,
    totalExpenses: v.expenses,
    profit: v.sales - v.expenses,
  }));

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = (() => {
    if (days.length === 0) {
      return { bestDay: null, worstDay: null, avgDailyProfit: 0, totalDaysWithData: 0 };
    }
    const sorted = [...days].sort((a, b) => b.profit - a.profit);
    return {
      bestDay: sorted[0],
      worstDay: sorted[sorted.length - 1],
      avgDailyProfit: days.reduce((s, d) => s + d.profit, 0) / days.length,
      totalDaysWithData: days.length,
    };
  })();

  // ── Weekly summary (last 12 weeks) ─────────────────────────────────────────
  const weeks12Start = startOfDay(subDays(today, 83)); // ~12 weeks
  const weekStarts = eachWeekOfInterval(
    { start: weeks12Start, end: today },
    { weekStartsOn: 1 }
  );

  const weeklySummary = weekStarts.map((ws) => {
    const we = endOfWeek(ws, { weekStartsOn: 1 });
    const wsStr = format(ws, "yyyy-MM-dd");
    const weStr = format(we, "yyyy-MM-dd");
    const inWeek = days.filter((d) => d.date >= wsStr && d.date <= weStr);
    const totalSales = inWeek.reduce((s, d) => s + d.totalSales, 0);
    const totalExpenses = inWeek.reduce((s, d) => s + d.totalExpenses, 0);
    return {
      weekStart: format(ws, "MMM d"),
      weekEnd: format(we > today ? today : we, "MMM d, yyyy"),
      weekStartRaw: wsStr,
      totalSales,
      totalExpenses,
      profit: totalSales - totalExpenses,
    };
  });

  // ── Monthly summary (last 12 months) ───────────────────────────────────────
  const months12Start = startOfMonth(subDays(today, 364));
  const monthStarts = eachMonthOfInterval({ start: months12Start, end: today });

  const monthlySummary = monthStarts.map((ms) => {
    const me = endOfMonth(ms);
    const msStr = format(ms, "yyyy-MM-dd");
    const meStr = format(me, "yyyy-MM-dd");
    const inMonth = days.filter((d) => d.date >= msStr && d.date <= meStr);
    const totalSales = inMonth.reduce((s, d) => s + d.totalSales, 0);
    const totalExpenses = inMonth.reduce((s, d) => s + d.totalExpenses, 0);
    return {
      month: format(ms, "MMMM yyyy"),
      totalSales,
      totalExpenses,
      profit: totalSales - totalExpenses,
      daysWithData: inMonth.length,
    };
  });

  return NextResponse.json({ stats, weeklySummary, monthlySummary });
}
