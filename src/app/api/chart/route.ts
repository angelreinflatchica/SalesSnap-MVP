import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay, format, parseISO } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const targetDate = dateParam ? parseISO(dateParam) : new Date();
  const chartData = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const day = subDays(targetDate, 6 - i);
      return (async () => {
        const [sales, expenses] = await Promise.all([
          prisma.salesEntry.findMany({
            where: {
              userId,
              date: { gte: startOfDay(day), lte: endOfDay(day) },
            },
          }),
          prisma.expense.findMany({
            where: {
              userId,
              date: { gte: startOfDay(day), lte: endOfDay(day) },
            },
          }),
        ]);
        const totalSales = sales.reduce((s: number, e: { amount: number }) => s + e.amount, 0);
        const totalExpenses = expenses.reduce((s: number, e: { amount: number }) => s + e.amount, 0);
        return {
          day: format(day, "EEE"),
          sales: totalSales,
          expenses: totalExpenses,
          profit: totalSales - totalExpenses,
        };
      })();
    })
  );

  return NextResponse.json({ chartData });
}
