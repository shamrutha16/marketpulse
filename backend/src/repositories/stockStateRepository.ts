import { and, eq, inArray } from 'drizzle-orm';
import { createId } from '../utils/id';
import { db } from '../db/client';
import { userStockState } from '../db/schema';
import type { LastSeenState } from '../domain/types';

export async function getLastSeenStates(userId: string, symbols: string[]): Promise<Map<string, LastSeenState>> {
  const map = new Map<string, LastSeenState>();
  if (symbols.length === 0) return map;
  const rows = await db
    .select()
    .from(userStockState)
    .where(and(eq(userStockState.userId, userId), inArray(userStockState.symbol, symbols)));
  for (const row of rows) {
    map.set(row.symbol, {
      seenAt: row.lastSeenAt ? row.lastSeenAt.toISOString() : null,
      price: row.lastSeenPrice,
      changePercent: row.lastSeenChangePct,
    });
  }
  for (const symbol of symbols) {
    if (!map.has(symbol)) map.set(symbol, { seenAt: null, price: null, changePercent: null });
  }
  return map;
}

export async function markSeen(
  userId: string,
  symbol: string,
  snapshot: { price: number; dayChangePercent: number; snapshotId?: string },
) {
  // A single atomic upsert, not select-then-branch: two concurrent
  // mark-seen calls for the same (userId, symbol) — e.g. React StrictMode's
  // deliberate double-invoke of effects in dev, or just two browser tabs —
  // would otherwise both see "no existing row" and both try to INSERT,
  // tripping the unique constraint. onConflictDoUpdate makes the race
  // impossible at the database level instead of trying to out-time it.
  await db
    .insert(userStockState)
    .values({
      id: createId('state'),
      userId,
      symbol,
      lastSeenAt: new Date(),
      lastSeenPrice: snapshot.price,
      lastSeenChangePct: snapshot.dayChangePercent,
      lastSeenSnapshotId: snapshot.snapshotId ?? null,
    })
    .onConflictDoUpdate({
      target: [userStockState.userId, userStockState.symbol],
      set: {
        lastSeenAt: new Date(),
        lastSeenPrice: snapshot.price,
        lastSeenChangePct: snapshot.dayChangePercent,
        lastSeenSnapshotId: snapshot.snapshotId ?? null,
        updatedAt: new Date(),
      },
    });
}
