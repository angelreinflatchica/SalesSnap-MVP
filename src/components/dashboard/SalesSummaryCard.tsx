"use client";

import { TrendingUp } from "lucide-react";
import { formatPeso } from "@/lib/formatCurrency";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import type { SalesEntry } from "@/types";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy, interpolate } from "@/lib/dashboardCopy";

interface SalesSummaryCardProps {
  sales: SalesEntry[];
  totalSales: number;
}

export function SalesSummaryCard({ sales, totalSales }: SalesSummaryCardProps) {
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);
  const entryLabel = sales.length === 1 ? copy.cards.entry : copy.cards.entries;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{copy.cards.totalSales}</CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold font-mono text-gray-900 dark:text-zinc-100">
          {formatPeso(totalSales)}
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
          {interpolate(copy.cards.selectedDayEntries, {
            count: sales.length,
            label: entryLabel,
          })}
        </p>
      </CardContent>
    </Card>
  );
}
