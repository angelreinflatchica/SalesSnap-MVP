"use client";

import { TrendingDown } from "lucide-react";
import { formatPeso } from "@/lib/formatCurrency";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import type { Expense } from "@/types";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy, interpolate } from "@/lib/dashboardCopy";

interface ExpenseSummaryCardProps {
  expenses: Expense[];
  totalExpenses: number;
}

export function ExpenseSummaryCard({
  expenses,
  totalExpenses,
}: ExpenseSummaryCardProps) {
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{copy.cards.totalExpenses}</CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold font-mono text-gray-900 dark:text-zinc-100">
          {formatPeso(totalExpenses)}
        </p>
        {expenses.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {expenses.slice(0, 4).map((e) => (
              <span
                key={e.id}
                className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400"
              >
                {e.label}
              </span>
            ))}
            {expenses.length > 4 && (
              <span className="text-xs text-gray-400 dark:text-zinc-500">
                {interpolate(copy.cards.more, { count: expenses.length - 4 })}
              </span>
            )}
          </div>
        ) : (
          <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">{copy.cards.noExpenses}</p>
        )}
      </CardContent>
    </Card>
  );
}
