"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";
import { formatPeso } from "@/lib/formatCurrency";
import type { DayChartData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy, interpolate } from "@/lib/dashboardCopy";

interface WeeklyChartProps {
  data: DayChartData[];
  selectedDate: string;
}

export function WeeklyChart({ data, selectedDate }: WeeklyChartProps) {
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-500">
          {interpolate(copy.cards.weeklyOverview, {
            date: format(parseISO(selectedDate), "MMM d, yyyy"),
          })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `₱${v}`}
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip
              formatter={(value) => formatPeso(Number(value))}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
              }}
            />
            <Bar dataKey="profit" fill="#16a34a" radius={[4, 4, 0, 0]} name={copy.cards.profit} />
            <Bar dataKey="expenses" fill="#FCA5A5" radius={[4, 4, 0, 0]} name={copy.cards.expenses} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
