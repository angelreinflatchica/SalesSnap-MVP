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
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS DailySummaryCache (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      language TEXT NOT NULL,
      summary TEXT NOT NULL,
      provider TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, date, language)
    )
  `);
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
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO DailySummaryCache (id, userId, date, language, summary, provider)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(userId, date, language)
      DO UPDATE SET
        summary = excluded.summary,
        provider = excluded.provider,
        updatedAt = CURRENT_TIMESTAMP
    `,
    id,
    args.userId,
    args.date,
    args.language,
    args.summary,
    args.provider
  );
}

export async function getDailySummary(args: {
  userId: string;
  date: string;
  language: SummaryLanguage;
}): Promise<CachedSummary | null> {
  await ensureTable();
  const rows = (await prisma.$queryRawUnsafe(
    `
      SELECT date, language, summary, provider, updatedAt
      FROM DailySummaryCache
      WHERE userId = ? AND date = ? AND language = ?
      LIMIT 1
    `,
    args.userId,
    args.date,
    args.language
  )) as CachedSummary[];

  return rows[0] ?? null;
}

export async function listDailySummaries(args: {
  userId: string;
  language: SummaryLanguage;
  days: number;
}): Promise<CachedSummary[]> {
  await ensureTable();
  const rows = (await prisma.$queryRawUnsafe(
    `
      SELECT date, language, summary, provider, updatedAt
      FROM DailySummaryCache
      WHERE userId = ? AND language = ?
      ORDER BY date DESC
      LIMIT ?
    `,
    args.userId,
    args.language,
    args.days
  )) as CachedSummary[];

  return rows;
}
