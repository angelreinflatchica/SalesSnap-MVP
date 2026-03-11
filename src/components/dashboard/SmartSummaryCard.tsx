"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, RefreshCcw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy } from "@/lib/dashboardCopy";

type ApiResponse = {
  summary: string;
  provider: "groq" | "gemini" | "fallback";
};

interface SmartSummaryCardProps {
  selectedDate: string;
}

export function SmartSummaryCard({ selectedDate }: SmartSummaryCardProps) {
  const [summary, setSummary] = useState("");
  const [provider, setProvider] = useState<ApiResponse["provider"]>("fallback");
  const [loading, setLoading] = useState(true);
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);

  const fetchSummary = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/daily-summary?date=${selectedDate}&lang=${language}${force ? "&force=1" : ""}`
      );
      if (!res.ok) throw new Error("Failed to load summary");
      const data: ApiResponse = await res.json();
      setSummary(data.summary);
      setProvider(data.provider);
    } catch {
      setSummary(copy.cards.aiSummaryFailed);
      setProvider("fallback");
    } finally {
      setLoading(false);
    }
  }, [copy.cards.aiSummaryFailed, selectedDate, language]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-zinc-100">
            <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
            {copy.cards.smartDailySummary}
          </CardTitle>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchSummary(true)}
              disabled={loading}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {copy.common.refresh}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          {format(parseISO(selectedDate), "EEEE, MMMM d, yyyy")}
        </p>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100 dark:bg-zinc-800" />
            <div className="h-3 w-full animate-pulse rounded bg-gray-100 dark:bg-zinc-800" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-zinc-800" />
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-zinc-200">{summary}</p>
            <p className="mt-3 text-[11px] uppercase tracking-wide text-gray-400 dark:text-zinc-500">
              {copy.common.source}: {provider === "fallback" ? copy.cards.ruleBasedFallback : provider.toUpperCase()}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
