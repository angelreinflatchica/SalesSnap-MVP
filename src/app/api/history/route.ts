import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay } from "date-fns";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const daysParam = Number(searchParams.get("days") ?? 30);
  const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 1), 365) : 30;

  const startDate = startOfDay(subDays(new Date(), days - 1));
  const endDate = endOfDay(new Date());

  // Fetch all sales and expenses in a single query for the date range
  const [sales, expenses] = await Promise.all([
    prisma.salesEntry.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "desc", createdAt: "desc" },
    }),
    prisma.expense.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "desc", createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ sales, expenses });
} 
