import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listDailySummaries } from "@/lib/dailySummaryStore";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") === "en" ? "en" : "tl";
  const daysParam = Number(searchParams.get("days") ?? 30);
  const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 1), 365) : 30;

  const summaries = await listDailySummaries({
    userId: session.user.id,
    language: lang,
    days,
  });

  return NextResponse.json({ summaries });
}
