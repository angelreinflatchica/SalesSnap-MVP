"use client";

import { formatPeso } from "@/lib/formatCurrency";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy } from "@/lib/dashboardCopy";

interface ProfitCardProps {
  profit: number;
}

export function ProfitCard({ profit }: ProfitCardProps) {
  const isPositive = profit > 0;
  const isBreakEven = profit === 0;
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);

  return (
    <Card className="w-full border-green-100 bg-gradient-to-br from-green-50 to-white dark:border-green-900/40 dark:from-emerald-950/50 dark:to-slate-950/40">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-muted-foreground">{copy.cards.todaysProfit}</p>
              {isPositive && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
            </div>
            <p
              className={`text-4xl font-bold font-mono tracking-tight ${
                isPositive
                  ? "text-green-700 dark:text-green-400"
                  : isBreakEven
                  ? "text-gray-600 dark:text-gray-300"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatPeso(profit)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isPositive
                ? copy.cards.inProfit
                : isBreakEven
                ? copy.cards.breakEven
                : copy.cards.inNegative}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
