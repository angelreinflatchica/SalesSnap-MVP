"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { ProfitCard } from "@/components/dashboard/ProfitCard";
import { SalesSummaryCard } from "@/components/dashboard/SalesSummaryCard";
import { ExpenseSummaryCard } from "@/components/dashboard/ExpenseSummaryCard";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { SmartSummaryCard } from "@/components/dashboard/SmartSummaryCard";
import { LogSalesForm } from "@/components/forms/LogSalesForm";
import { AddExpenseForm } from "@/components/forms/AddExpenseForm";
import { calculateProfit } from "@/lib/profit";
import type { SalesEntry, Expense, DayChartData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy } from "@/lib/dashboardCopy";
import { resolveEffectiveExpenses } from "@/lib/spreadExpense";
import { formatPeso } from "@/lib/formatCurrency";

async function safeJson<T>(res: Response, fallback: T): Promise<T> {
  try {
    const text = await res.text();
    if (!text) return fallback;
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export default function DashboardPage() {
  const [sales, setSales] = useState<SalesEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [chartData, setChartData] = useState<DayChartData[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const fetchData = useCallback(async () => {
    const [salesRes, expensesRes, chartRes] = await Promise.all([
      fetch(`/api/sales?date=${selectedDate}`),
      fetch(`/api/expenses?date=${selectedDate}`),
      fetch(`/api/chart?date=${selectedDate}`),
    ]);
    const [salesData, expensesData, chartResult] = await Promise.all([
      safeJson<{ sales?: SalesEntry[] }>(salesRes, {}),
      safeJson<{ expenses?: Expense[] }>(expensesRes, {}),
      safeJson<{ chartData?: DayChartData[] }>(chartRes, {}),
    ]);
    setSales(salesData.sales ?? []);
    setExpenses(expensesData.expenses ?? []);
    setChartData(chartResult.chartData ?? []);
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { totalSales, totalExpenses, profit } = calculateProfit(sales, expenses);
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);

  // Get active bulk expenses for selected date
  const effectiveExpenses = resolveEffectiveExpenses(expenses, new Date(selectedDate));
  const activeBulkExpenses = effectiveExpenses.filter((exp) => exp.spreadDays > 1);

  return (
    <div className="w-full py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">{copy.dashboard.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.dashboard.subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="dashboard-date" className="text-sm font-medium text-muted-foreground">
          {copy.dashboard.date}:
        </label>
        <input
          id="dashboard-date"
          type="date"
          value={selectedDate}
          max={format(new Date(), "yyyy-MM-dd")}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/40"
        />
      </div>

      {/* Quick Guide Banner */}
      <Card className="border-l-4 border-l-green-500 bg-green-50/60 dark:bg-green-950/20 dark:border-l-green-400">
        <CardContent className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
                  {copy.dashboard.quickGuideTitle}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {copy.dashboard.quickGuideSubtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {copy.dashboard.quickGuideSteps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-green-100 bg-white/80 p-3 shadow-sm transition-colors duration-200 hover:border-green-200 dark:border-green-900/40 dark:bg-zinc-950/70">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-[11px] font-semibold text-green-900 dark:bg-green-900/60 dark:text-green-200">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-foreground">
                    {step}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Forms Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-amber-100 dark:border-amber-900/30">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              {copy.dashboard.addExpenseCard}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddExpenseForm
              expenses={expenses}
              onSuccess={fetchData}
              selectedDate={selectedDate}
            />
          </CardContent>
        </Card>

        <Card className="border-green-100 dark:border-green-900/40">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              {copy.dashboard.logSaleCard}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LogSalesForm
              sales={sales}
              onSuccess={fetchData}
              selectedDate={selectedDate}
            />
          </CardContent>
        </Card>
      </div>

      {/* Active bulk purchases section */}
      {activeBulkExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800 dark:text-zinc-200">
              Active Bulk Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeBulkExpenses.map((expense) => {
                const progressPercent =
                  expense.daysRemaining && expense.spreadDays
                    ? Math.round(
                        ((expense.spreadDays - (expense.daysRemaining || 0)) /
                          expense.spreadDays) *
                          100
                      )
                    : 0;

                const progressColor =
                  expense.daysRemaining && expense.daysRemaining > 1
                    ? "bg-green-500"
                    : "bg-amber-500";

                return (
                  <div key={expense.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {expense.label}
                      </p>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {formatPeso(expense.effectiveAmount)}
                        /day
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${progressColor} transition-all duration-300`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {expense.daysRemaining} day{expense.daysRemaining !== 1 ? "s" : ""}{" "}
                      remaining
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Section: Smart Summary and Chart */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SmartSummaryCard selectedDate={selectedDate} />
        <WeeklyChart data={chartData} selectedDate={selectedDate} />
      </div>
    </div>
  );
}
