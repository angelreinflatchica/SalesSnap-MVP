import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type SummaryLanguage = "en" | "tl";

type CachedSummary = {
  date: string;
  language: SummaryLanguage;
  summary: string;
  provider: string;
  updatedAt: string;
};

async function ensureTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS dailysummarycache (
      id TEXT PRIMARY KEY,
      userid TEXT NOT NULL,
      date TEXT NOT NULL,
      language TEXT NOT NULL,
      summary TEXT NOT NULL,
      provider TEXT NOT NULL,
      createdat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userid, date, language)
    )
  `;
}

export async function upsertDailySummary(args: {
  userId: string;
  date: string;
  language: SummaryLanguage;
  summary: string;
  provider: string;
}) {
  await ensureTable();
  const id = `${args.userId}_${args.date}_${args.language}`;

  await prisma.$executeRaw`
    INSERT INTO dailysummarycache (id, userid, date, language, summary, provider)
    VALUES (${id}, ${args.userId}, ${args.date}, ${args.language}, ${args.summary}, ${args.provider})
    ON CONFLICT (userid, date, language)
    DO UPDATE SET
      summary = EXCLUDED.summary,
      provider = EXCLUDED.provider,
      updatedat = CURRENT_TIMESTAMP
  `;
}

export async function getDailySummary(args: {
  userId: string;
  date: string;
  language: SummaryLanguage;
}): Promise<CachedSummary | null> {
  await ensureTable();
  const rows = await prisma.$queryRaw<CachedSummary[]>(Prisma.sql`
    SELECT date, language, summary, provider, updatedat AS "updatedAt"
    FROM dailysummarycache
    WHERE userid = ${args.userId} AND date = ${args.date} AND language = ${args.language}
    LIMIT 1
  `);

  return rows[0] ?? null;
}

export async function listDailySummaries(args: {
  userId: string;
  language: SummaryLanguage;
  days: number;
}): Promise<CachedSummary[]> {
  await ensureTable();
  const rows = await prisma.$queryRaw<CachedSummary[]>(Prisma.sql`
    SELECT date, language, summary, provider, updatedat AS "updatedAt"
    FROM dailysummarycache
    WHERE userid = ${args.userId} AND language = ${args.language}
    ORDER BY date DESC
    LIMIT ${args.days}
  `);

  return rows;
}
