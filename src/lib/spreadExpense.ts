import { addDays } from "date-fns";
import type { Expense, EffectiveExpense, ExpenseType } from "@/types";

type SpreadExpenseInput = Pick<Expense, "id" | "label" | "amount" | "date"> & {
  expenseType?: ExpenseType;
  spreadDays?: number;
  dailyAmount?: number | null;
  spreadEndDate?: string | Date | null;
};

/**
 * Compute the daily amount for a spread expense
 * @param amount Total expense amount
 * @param spreadDays Number of days to spread across
 * @returns Daily amount rounded to 2 decimal places
 */
export function computeDailyAmount(amount: number, spreadDays: number): number {
  return Math.round((amount / spreadDays) * 100) / 100;
}

/**
 * Compute the end date for a spread expense
 * @param startDate The date the expense was created
 * @param spreadDays Number of days to spread across
 * @returns The last date the expense applies to
 */
export function computeSpreadEndDate(
  startDate: Date,
  spreadDays: number
): Date {
  // If spreading 7 days, we want start date + 6 days (covers 7 days total including start date)
  return addDays(startDate, spreadDays - 1);
}

/**
 * Check if a bulk expense is active on a given date
 * @param expense The expense object
 * @param date The date to check
 * @returns true if the expense applies to this date
 */
export function isBulkExpenseActiveOn(
  expense: SpreadExpenseInput,
  date: Date
): boolean {
  const spreadDays = expense.spreadDays ?? 1;
  const spreadEndDate = expense.spreadEndDate ?? null;

  if (spreadDays === 1 || !spreadEndDate) {
    // One-time expense applies only on its date
    return (
      new Date(expense.date).toDateString() === new Date(date).toDateString()
    );
  }

  // Bulk expense applies from its date to spreadEndDate (inclusive on both ends)
  const expenseStart = new Date(expense.date);
  const expenseEnd = new Date(spreadEndDate);
  const checkDate = new Date(date);

  expenseStart.setHours(0, 0, 0, 0);
  expenseEnd.setHours(0, 0, 0, 0);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate >= expenseStart && checkDate <= expenseEnd;
}

/**
 * Resolve expenses to their effective daily amounts for a given date
 * @param expenses Array of expenses
 * @param date The date to resolve for
 * @returns Array of effective expenses for this date
 */
export function resolveEffectiveExpenses(
  expenses: SpreadExpenseInput[],
  date: Date
): EffectiveExpense[] {
  return expenses
    .filter((exp) => isBulkExpenseActiveOn(exp, date))
    .map((exp) => {
      const expenseType = exp.expenseType ?? "one-time";
      const spreadDays = exp.spreadDays ?? 1;
      const spreadEndDate = exp.spreadEndDate ?? null;
      const dailyAmount =
        expenseType === "bulk" && exp.dailyAmount !== null && exp.dailyAmount !== undefined
          ? exp.dailyAmount
          : exp.amount;

      let daysRemaining: number | undefined;
      if (spreadDays > 1 && spreadEndDate) {
        const expenseEnd = new Date(spreadEndDate);
        const checkDate = new Date(date);
        expenseEnd.setHours(0, 0, 0, 0);
        checkDate.setHours(0, 0, 0, 0);

        daysRemaining =
          Math.ceil(
            (expenseEnd.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;
      }

      return {
        id: exp.id,
        label: exp.label,
        effectiveAmount: dailyAmount,
        expenseType,
        spreadDays,
        daysRemaining,
      };
    });
}
