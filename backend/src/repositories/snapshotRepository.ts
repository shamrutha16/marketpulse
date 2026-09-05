import { and, asc, desc, eq, gte, inArray } from 'drizzle-orm';
import { createId } from '../utils/id';
import { db } from '../db/client';
import { stockSnapshots } from '../db/schema';
import type { Freshness, PriceSnapshot } from '../domain/types';

export async function insertSnapshots(snapshots: PriceSnapshot[]) {
  if (snapshots.length === 0) return;
  await db.insert(stockSnapshots).values(
    snapshots.map((s) => ({
      id: createId('snap'),
      symbol: s.symbol,
      price: s.price,
      dayChangePercent: s.dayChangePercent,
      volumeRatio: s.volumeRatio,
      dayHigh: s.dayHigh ?? null,
      dayLow: s.dayLow ?? null,
      sector: s.sector ?? null,
      timestamp: new Date(s.timestamp),
      provider: s.provider,
      freshness: s.freshness as Freshness,
    })),
  );
}

export async function getRecentHistory(symbol: string, sinceMs: number) {
  return db
    .select()
    .from(stockSnapshots)
    .where(and(eq(stockSnapshots.symbol, symbol), gte(stockSnapshots.timestamp, new Date(Date.now() - sinceMs))))
    .orderBy(asc(stockSnapshots.timestamp));
}

export async function getLatestSnapshots(symbols: string[]) {
  if (symbols.length === 0) return [];
  // One query per symbol would N+1; instead pull recent rows for all symbols
  // and reduce in memory — cheap at watchlist scale (see README "Scaling
  // considerations" for the path to a proper "latest per symbol" index/view
  // once watchlists get large).
  const rows = await db
    .select()
    .from(stockSnapshots)
    .where(inArray(stockSnapshots.symbol, symbols))
    .orderBy(desc(stockSnapshots.timestamp))
    .limit(symbols.length * 20);
  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latest.has(row.symbol)) latest.set(row.symbol, row);
  }
  return [...latest.values()];
}
