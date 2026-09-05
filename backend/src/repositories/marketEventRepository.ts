import { and, desc, eq, gte } from 'drizzle-orm';
import { createId } from '../utils/id';
import { db } from '../db/client';
import { marketEvents } from '../db/schema';

export type MarketEventType =
  | 'MARKET_OPENED'
  | 'THRESHOLD_CROSSED'
  | 'VOLUME_UNUSUAL'
  | 'USER_VISIT'
  | 'MEANINGFUL_CHANGE_TRIGGERED'
  | 'PROVIDER_DEGRADED'
  | 'PROVIDER_RECOVERED';

export async function recordEvent(symbol: string, type: MarketEventType, metadata?: Record<string, unknown>) {
  await db.insert(marketEvents).values({ id: createId('evt'), symbol, type, metadata: metadata ?? null });
}

export async function getTimeline(symbol: string, sinceMs = 24 * 60 * 60 * 1000, limit = 100) {
  const rows = await db
    .select()
    .from(marketEvents)
    .where(and(eq(marketEvents.symbol, symbol), gte(marketEvents.timestamp, new Date(Date.now() - sinceMs))))
    .orderBy(desc(marketEvents.timestamp))
    .limit(limit);
  return rows.reverse(); // chronological ascending for display
}
