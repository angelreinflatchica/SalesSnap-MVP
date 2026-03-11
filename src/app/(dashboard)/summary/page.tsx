"use client";

import { useEffect, useState } from "react";
import { formatPeso } from "@/lib/formatCurrency";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Star, AlertCircle, BarChart2 } from "lucide-react";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy, interpolate } from "@/lib/dashboardCopy";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayStats {
  date: string;
  totalSales: number;
  totalExpenses: number;
  profit: number;
}

interface WeekRow {
  weekStart: string;
  weekEnd: string;
  weekStartRaw: string;
  totalSales: number;
  totalExpenses: number;
  profit: number;
}

interface MonthRow {
  month: string;
  totalSales: number;
  totalExpenses: number;
  profit: number;
  daysWithData: number;
}

interface SummaryData {
  stats: {
    bestDay: DayStats | null;
    worstDay: DayStats | null;
    avgDailyProfit: number;
    totalDaysWithData: number;
  };
  weeklySummary: WeekRow[];
  monthlySummary: MonthRow[];
}

interface SavedSummaryRow {
  date: string;
  summary: string;
  provider: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ProfitBadge({ value }: { value: number }) {
  if (value > 0)
    return (
      <span className="inline-flex items-center gap-1 font-mono font-semibold text-green-700">
        <TrendingUp className="h-3.5 w-3.5" />
        {formatPeso(value)}
      </span>
    );
  if (value < 0)
    return (
      <span className="inline-flex items-center gap-1 font-mono font-semibold text-red-600">
        <TrendingDown className="h-3.5 w-3.5" />
        {formatPeso(value)}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 font-mono font-semibold text-gray-500">
      <Minus className="h-3.5 w-3.5" />
      {formatPeso(0)}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SummaryPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [savedSummary, setSavedSummary] = useState<SavedSummaryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/summary").then((r) => r.json()),
      fetch(`/api/daily-summary/history?days=30&lang=${language}`).then((r) => r.json()),
    ]).then(([d, s]) => {
      setData(d);
      const latest = (s.summaries as SavedSummaryRow[] | undefined)?.[0] ?? null;
      setSavedSummary(latest);
      setLoading(false);
    });
  }, [language]);

  return (
    <div className="w-full py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{copy.summary.title}</h1>
        <p className="text-sm text-gray-500">{copy.summary.subtitle}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
        </div>
      ) : !data || data.stats.totalDaysWithData === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart2 className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">{copy.summary.noData}</p>
            <p className="text-sm text-gray-400 mt-1">
              {copy.summary.startLogging}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {savedSummary && (
            <Card className="border-green-100 bg-green-50/60 dark:border-green-900/50 dark:bg-green-950/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {copy.summary.latestSaved}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-zinc-200">{savedSummary.summary}</p>
                <p className="mt-2 text-xs text-gray-400 dark:text-zinc-500">
                  {savedSummary.date} · {copy.common.source}: {savedSummary.provider === "fallback" ? copy.common.ruleBased : savedSummary.provider.toUpperCase()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ── Stat Cards ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Best Day */}
            <Card className="border-green-100 bg-green-50">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-green-700">
                  <Star className="h-3.5 w-3.5" />
                  {copy.summary.bestDay}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {data.stats.bestDay ? (
                  <>
                    <p className="font-mono text-xl font-bold text-green-700">
                      {formatPeso(data.stats.bestDay.profit)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(parseISO(data.stats.bestDay.date), "EEEE, MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {copy.summary.salesShort} {formatPeso(data.stats.bestDay.totalSales)} · {copy.summary.expensesShort}{" "}
                      {formatPeso(data.stats.bestDay.totalExpenses)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">—</p>
                )}
              </CardContent>
            </Card>

            {/* Worst Day */}
            <Card className="border-red-100 bg-red-50">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {copy.summary.worstDay}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {data.stats.worstDay ? (
                  <>
                    <p className={`font-mono text-xl font-bold ${data.stats.worstDay.profit < 0 ? "text-red-600" : "text-gray-700"}`}>
                      {formatPeso(data.stats.worstDay.profit)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(parseISO(data.stats.worstDay.date), "EEEE, MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {copy.summary.salesShort} {formatPeso(data.stats.worstDay.totalSales)} · {copy.summary.expensesShort}{" "}
                      {formatPeso(data.stats.worstDay.totalExpenses)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">—</p>
                )}
              </CardContent>
            </Card>

            {/* Avg Daily Profit */}
            <Card className="border-blue-100 bg-blue-50">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  <BarChart2 className="h-3.5 w-3.5" />
                  {copy.summary.avgDailyProfit}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className={`font-mono text-xl font-bold ${data.stats.avgDailyProfit >= 0 ? "text-blue-700" : "text-red-600"}`}>
                  {formatPeso(data.stats.avgDailyProfit)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {interpolate(copy.summary.acrossDays, { count: data.stats.totalDaysWithData })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Tabs ────────────────────────────────────────────────────────── */}
          <div>
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
              {(["weekly", "monthly"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
                    tab === t
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t === "weekly" ? copy.summary.weekly : copy.summary.monthly}
                </button>
              ))}
            </div>

            {/* ── Weekly Table ──────────────────────────────────────────────── */}
            {tab === "weekly" && (
              <div className="mt-4 space-y-2">
                {[...data.weeklySummary].reverse().map((w) => (
                  <Card key={w.weekStartRaw}>
                    <CardContent className="px-4 py-3">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {w.weekStart} – {w.weekEnd}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {copy.summary.salesShort} {formatPeso(w.totalSales)} · {copy.summary.expensesLong} {formatPeso(w.totalExpenses)}
                          </p>
                        </div>
                        <ProfitBadge value={w.profit} />
                      </div>
                      {/* Mini progress bar */}
                      {(w.totalSales > 0 || w.totalExpenses > 0) && (
                        <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{
                              width: `${Math.min(
                                100,
                                w.totalSales > 0
                                  ? ((w.totalSales - w.totalExpenses) / w.totalSales) * 100
                                  : 0
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* ── Monthly Table ─────────────────────────────────────────────── */}
            {tab === "monthly" && (
              <div className="mt-4 space-y-2">
                {[...data.monthlySummary].reverse().map((m) => (
                  <Card key={m.month}>
                    <CardContent className="px-4 py-3">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{m.month}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {copy.summary.salesShort} {formatPeso(m.totalSales)} · {copy.summary.expensesLong} {formatPeso(m.totalExpenses)}
                            {m.daysWithData > 0 && ` · ${interpolate(copy.summary.daysActive, { count: m.daysWithData })}`}
                          </p>
                        </div>
                        <ProfitBadge value={m.profit} />
                      </div>
                      {/* Mini progress bar */}
                      {(m.totalSales > 0 || m.totalExpenses > 0) && (
                        <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{
                              width: `${Math.min(
                                100,
                                m.totalSales > 0
                                  ? ((m.totalSales - m.totalExpenses) / m.totalSales) * 100
                                  : 0
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
