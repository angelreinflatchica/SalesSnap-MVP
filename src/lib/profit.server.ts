import "server-only";

import { startOfDay, endOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { resolveEffectiveExpenses } from "@/lib/spreadExpense";
import type { Expense, SalesEntry, EffectiveExpense } from "@/types";

export interface DailyData {
  sales: SalesEntry[];
  effectiveExpenses: EffectiveExpense[];
  totalSales: number;
  totalExpenses: number;
  profit: number;
}

export async function getDailyData(
  userId: string,
  date: Date
): Promise<DailyData> {
  const sales = await prisma.salesEntry.findMany({
    where: {
      userId,
      date: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
    },
  });

  const allExpenses = await prisma.expense.findMany({
    where: { userId },
  });

  const normalizedExpenses: Expense[] = allExpenses.map((exp: any) => ({
    ...exp,
    expenseType: exp.expenseType ?? "one-time",
    spreadDays: exp.spreadDays ?? 1,
    dailyAmount: exp.dailyAmount ?? null,
    spreadEndDate: exp.spreadEndDate ?? null,
  }));

  const effectiveExpenses = resolveEffectiveExpenses(normalizedExpenses, date);
  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalExpenses = effectiveExpenses.reduce(
    (sum, e) => sum + e.effectiveAmount,
    0
  );

  return {
    sales,
    effectiveExpenses,
    totalSales,
    totalExpenses,
    profit: totalSales - totalExpenses,
  };
}
