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

  return (
    <div className="w-full py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{copy.dashboard.title}</h1>
        <p className="text-sm text-gray-500">{copy.dashboard.subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="dashboard-date" className="text-sm font-medium text-gray-600">
          {copy.dashboard.date}:
        </label>
        <input
          id="dashboard-date"
          type="date"
          value={selectedDate}
          max={format(new Date(), "yyyy-MM-dd")}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-3">
          <ProfitCard profit={profit} />
        </div>
        <SalesSummaryCard sales={sales} totalSales={totalSales} />
        <ExpenseSummaryCard expenses={expenses} totalExpenses={totalExpenses} />
        <div className="flex items-center justify-center rounded-xl border border-gray-100 bg-white p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">{copy.dashboard.entriesOnSelectedDay}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {sales.length + expenses.length}
            </p>
          </div>
        </div>
      </div>

      {/* Entry forms */}
      <SmartSummaryCard selectedDate={selectedDate} />

      {/* Entry forms */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800">
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
      </div>

      {/* Weekly chart */}
      <WeeklyChart data={chartData} selectedDate={selectedDate} />
    </div>
  );
}
