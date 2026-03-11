import type { SalesEntry, Expense } from "@/types";

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
