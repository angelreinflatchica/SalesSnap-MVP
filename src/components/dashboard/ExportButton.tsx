"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { startOfWeek, format, isWithinInterval, endOfDay, startOfDay, parseISO } from "date-fns";
import { exportToExcel, exportToPDF, type GroupedEntry } from "@/lib/export";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy, interpolate } from "@/lib/dashboardCopy";

interface ExportButtonProps {
  data: GroupedEntry[];
  businessName: string;
}

const PERIOD_VALUES = ["today", "week", "all"] as const;

type Period = (typeof PERIOD_VALUES)[number];

function getPeriods(copy: ReturnType<typeof getDashboardCopy>) {
  return [
    { label: copy.export.today, value: "today" },
    { label: copy.export.thisWeek, value: "week" },
    { label: copy.export.fullHistory, value: "all" },
  ] as const;
}

function filterData(data: GroupedEntry[], period: Period): GroupedEntry[] {
  const now = new Date();
  if (period === "today") {
    const todayStr = format(now, "yyyy-MM-dd");
    return data.filter((g) => g.date === todayStr);
  }
  if (period === "week") {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    return data.filter((g) => {
      const d = parseISO(g.date);
      return isWithinInterval(d, { start: startOfDay(weekStart), end: endOfDay(now) });
    });
  }
  return data;
}

function periodLabel(period: Period, copy: ReturnType<typeof getDashboardCopy>): string {
  const now = new Date();
  if (period === "today") {
    return interpolate(copy.export.todayLabel, { date: format(now, "MMM d, yyyy") });
  }
  if (period === "week") {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    return interpolate(copy.export.weekOf, {
      start: format(weekStart, "MMM d"),
      end: format(now, "MMM d, yyyy"),
    });
  }
  return copy.export.last30Days;
}

export function ExportButton({ data, businessName }: ExportButtonProps) {
  const [period, setPeriod] = useState<Period>("today");
  const [loading, setLoading] = useState<"excel" | "pdf" | null>(null);
  const [open, setOpen] = useState(false);
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);
  const periods = getPeriods(copy);

  async function handleExport(format: "excel" | "pdf") {
    const filtered = filterData(data, period);
    if (filtered.length === 0) {
      alert(copy.export.noData);
      return;
    }
    setLoading(format);
    try {
      const label = periodLabel(period, copy);
      if (format === "excel") {
        await exportToExcel(filtered, businessName, label);
      } else {
        await exportToPDF(filtered, businessName, label);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Period selector */}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <FileDown className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
          {periods.find((p) => p.value === period)?.label}
          <ChevronDown className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => {
                    setPeriod(p.value);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50 dark:hover:bg-zinc-700 ${
                    period === p.value
                      ? "bg-green-50 font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300"
                      : "text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Excel button */}
      <button
        onClick={() => handleExport("excel")}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 shadow-sm hover:bg-emerald-100 disabled:opacity-50 transition-colors dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
      >
        <FileSpreadsheet className="h-4 w-4" />
        {loading === "excel" ? copy.export.exporting : "Excel"}
      </button>

      {/* PDF button */}
      <button
        onClick={() => handleExport("pdf")}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-100 disabled:opacity-50 transition-colors dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
      >
        <FileText className="h-4 w-4" />
        {loading === "pdf" ? copy.export.exporting : "PDF"}
      </button>
    </div>
  );
}
