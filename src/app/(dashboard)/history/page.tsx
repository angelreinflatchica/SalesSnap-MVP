"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { format, parseISO } from "date-fns";
import { Pencil, Trash2, Search } from "lucide-react";
import { formatPeso } from "@/lib/formatCurrency";
import { calculateProfit } from "@/lib/profit";
import type { SalesEntry, Expense } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButton } from "@/components/dashboard/ExportButton";
import type { GroupedEntry } from "@/lib/export";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy } from "@/lib/dashboardCopy";
import { sendOrQueue } from "@/lib/offlineSync";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function safeJson<T>(res: Response, fallback: T): Promise<T> {
  try {
    const text = await res.text();
    if (!text) return fallback;
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

interface CachedSummaryRow {
  date: string;
  summary: string;
  provider: string;
}

type HistoryEntry = GroupedEntry & {
  smartSummary?: string;
  summaryProvider?: string;
};

export default function HistoryPage() {
  const { data: session } = useSession();
  const [grouped, setGrouped] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSale, setEditingSale] = useState<SalesEntry | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editNote, setEditNote] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const days = 30;
      const results: HistoryEntry[] = [];

      const summaryRes = await fetch(`/api/daily-summary/history?days=${days}&lang=${language}`);
      const summaryData = await safeJson<{ summaries?: CachedSummaryRow[] }>(summaryRes, {});
      const summaryMap = new Map<string, { summary: string; provider: string }>();
      const rows: CachedSummaryRow[] = summaryData.summaries ?? [];
      rows.forEach((row) => {
        summaryMap.set(row.date, { summary: row.summary, provider: row.provider });
      });

      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = format(d, "yyyy-MM-dd");

        const [salesRes, expensesRes] = await Promise.all([
          fetch(`/api/sales?date=${dateStr}`),
          fetch(`/api/expenses?date=${dateStr}`),
        ]);
        const [salesData, expensesData] = await Promise.all([
          safeJson<{ sales?: SalesEntry[] }>(salesRes, {}),
          safeJson<{ expenses?: Expense[] }>(expensesRes, {}),
        ]);

        const sales: SalesEntry[] = salesData.sales ?? [];
        const expenses: Expense[] = expensesData.expenses ?? [];

        if (sales.length > 0 || expenses.length > 0) {
          const { totalSales, totalExpenses, profit } = calculateProfit(sales, expenses);
          const savedSummary = summaryMap.get(dateStr);
          results.push({
            date: dateStr,
            sales,
            expenses,
            totalSales,
            totalExpenses,
            profit,
            smartSummary: savedSummary?.summary,
            summaryProvider: savedSummary?.provider,
          });
        }
      }

      setGrouped(results);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredHistory = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return grouped;
    return grouped.filter((entry) => {
      const dateFormatted = format(parseISO(entry.date), "EEEE, MMMM d, yyyy").toLowerCase();
      if (dateFormatted.includes(query) || entry.date.includes(query)) return true;
      if (entry.smartSummary?.toLowerCase().includes(query)) return true;
      const saleMatch = entry.sales.some((sale) => {
        return (
          sale.note?.toLowerCase().includes(query) ||
          String(sale.amount).includes(query)
        );
      });
      if (saleMatch) return true;
      const expenseMatch = entry.expenses.some((expense) => {
        return (
          expense.label.toLowerCase().includes(query) ||
          String(expense.amount).includes(query)
        );
      });
      if (expenseMatch) return true;
      if (
        String(entry.totalSales).includes(query) ||
        String(entry.totalExpenses).includes(query) ||
        String(entry.profit).includes(query)
      ) {
        return true;
      }
      return false;
    });
  }, [grouped, searchTerm]);

  const hasSearch = searchTerm.trim().length > 0;
  const visibleEntries = hasSearch ? filteredHistory : grouped;
  const totalTrackedDays = grouped.length;
  const showingCount = hasSearch ? visibleEntries.length : totalTrackedDays;
  const showSearchEmpty = totalTrackedDays > 0 && hasSearch && visibleEntries.length === 0;

  function startEdit(sale: SalesEntry) {
    setEditingSale(sale);
    setEditAmount(sale.amount);
    setEditNote(sale.note ?? "");
    setEditDate(new Date(sale.date).toISOString().slice(0, 10));
  }

  async function saveEdit() {
    if (!editingSale) return;
    if (!Number.isFinite(editAmount) || editAmount <= 0) return;

    setIsUpdating(true);
    try {
      const { queued, response } = await sendOrQueue(`/api/sales/${editingSale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: editAmount, note: editNote, date: editDate }),
      });

      if (queued) {
        setEditingSale(null);
        await fetchHistory();
        return;
      }

      if (!response?.ok) return;

      setEditingSale(null);
      await fetchHistory();
    } finally {
      setIsUpdating(false);
    }
  }

  async function deleteSale(id: string) {
    if (!window.confirm("Delete this sale?")) return;
    const { queued, response } = await sendOrQueue(`/api/sales/${id}`, { method: "DELETE" });
    if (!queued && !response?.ok) return;
    await fetchHistory();
  }

  return (
    <div className="w-full py-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{copy.history.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.history.subtitle}</p>
        </div>
        {!loading && grouped.length > 0 && (
          <ExportButton
            data={grouped}
            businessName={session?.user?.name ?? "My Business"}
          />
        )}
      </div>

      <div className="rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Filter history</p>
            <p className="text-xs text-muted-foreground">
              Showing {showingCount} of {totalTrackedDays} tracked day{totalTrackedDays === 1 ? "" : "s"}
            </p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={copy.history.searchPlaceholder}
              className="pl-9"
              aria-label={copy.history.searchPlaceholder}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600"></div>
        </div>
      ) : totalTrackedDays === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">{copy.history.noEntries}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {copy.history.startLogging}
            </p>
          </CardContent>
        </Card>
      ) : showSearchEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">{copy.history.searchEmpty}</p>
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="inline-flex items-center rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Clear search
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleEntries.map(({ date, sales, expenses, totalSales, totalExpenses, profit, smartSummary, summaryProvider }) => (
            <Card key={date}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-foreground">
                    {format(parseISO(date), "EEEE, MMMM d, yyyy")}
                  </CardTitle>
                  <span
                    className={`font-mono text-sm font-bold ${
                      profit >= 0 ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatPeso(profit)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 dark:border-green-900/50 dark:bg-green-950/30">
                    <p className="text-xs text-muted-foreground">{copy.history.sales}</p>
                    <p className="font-mono font-semibold text-green-700 dark:text-green-400">
                      {formatPeso(totalSales)}
                    </p>
                    <p className="text-xs text-muted-foreground">{sales.length} {copy.history.entries}</p>
                  </div>
                  <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 dark:border-red-900/50 dark:bg-red-950/30">
                    <p className="text-xs text-muted-foreground">{copy.history.expenses}</p>
                    <p className="font-mono font-semibold text-red-600 dark:text-red-400">
                      {formatPeso(totalExpenses)}
                    </p>
                    <p className="text-xs text-muted-foreground">{expenses.length} {copy.history.entries}</p>
                  </div>
                </div>

                {sales.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sales</p>
                    {sales.map((sale) => (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
                      >
                        <div>
                          <p className="text-xs font-semibold text-foreground">{formatPeso(sale.amount)}</p>
                          {sale.note && <p className="text-xs text-muted-foreground">{sale.note}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(sale)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-950/40 transition-colors"
                            aria-label="Edit sale"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSale(sale.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 transition-colors"
                            aria-label="Delete sale"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {expenses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {expenses.map((e) => (
                      <span
                        key={e.id}
                        className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground"
                      >
                        {e.label} · {formatPeso(e.amount)}
                      </span>
                    ))}
                  </div>
                )}

                {smartSummary && (
                  <div className="rounded-lg border border-green-100 bg-green-50/60 px-3 py-2 dark:border-green-900/50 dark:bg-green-950/30">
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">
                      {copy.history.savedSmartSummary}
                    </p>
                    <p className="mt-1 text-sm text-foreground">{smartSummary}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {copy.common.source}: {summaryProvider === "fallback" ? copy.common.ruleBased : String(summaryProvider).toUpperCase()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingSale} onOpenChange={(open) => !open && setEditingSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="history-edit-sale-amount">Amount</Label>
              <Input
                id="history-edit-sale-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="history-edit-sale-note">Note</Label>
              <Input
                id="history-edit-sale-note"
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="history-edit-sale-date">Date</Label>
              <Input
                id="history-edit-sale-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditingSale(null)}
              className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveEdit}
              disabled={isUpdating}
              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {isUpdating ? "Saving..." : "Save changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
