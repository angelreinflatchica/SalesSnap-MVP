import type { SalesEntry, Expense, EffectiveExpense } from "@/types";
import { resolveEffectiveExpenses } from "@/lib/spreadExpense";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export interface DailyData {
  sales: SalesEntry[];
  effectiveExpenses: EffectiveExpense[];
  totalSales: number;
  totalExpenses: number;
  profit: number;
}

/**
 * Get daily data with spread-aware expense calculations
 * @param userId User ID to fetch data for
 * @param date The date to calculate profit for
 * @returns Daily sales, effective expenses, and calculated profit
 */
export async function getDailyData(
  userId: string,
  date: Date
): Promise<DailyData> {
  // Fetch sales for exact date
  const sales = await prisma.salesEntry.findMany({
    where: {
      userId,
      date: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
    },
  });

  // Fetch ALL expenses (needed to check spread windows)
  const allExpenses = await prisma.expense.findMany({
    where: { userId },
  });

  // Resolve effective expenses for this date
  const effectiveExpenses = resolveEffectiveExpenses(allExpenses, date);

  // Calculate totals
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

export function calculateProfit(
  sales: SalesEntry[],
  expenses: Expense[]
): { totalSales: number; totalExpenses: number; profit: number } {
  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  return {
    totalSales,
    totalExpenses,
    profit: totalSales - totalExpenses,
  };
}

