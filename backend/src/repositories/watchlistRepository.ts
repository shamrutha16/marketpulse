import { and, asc, eq } from 'drizzle-orm';
import { createId } from '../utils/id';
import { db } from '../db/client';
import { watchlistItems, watchlists } from '../db/schema';

export async function listWatchlists(userId: string) {
  return db.select().from(watchlists).where(eq(watchlists.userId, userId)).orderBy(asc(watchlists.createdAt));
}

export async function getWatchlist(userId: string, watchlistId: string) {
  const [row] = await db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.id, watchlistId), eq(watchlists.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createWatchlist(userId: string, name: string) {
  const id = createId('wl');
  await db.insert(watchlists).values({ id, userId, name });
  return getWatchlist(userId, id);
}

export async function renameWatchlist(userId: string, watchlistId: string, name: string) {
  await db
    .update(watchlists)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(watchlists.id, watchlistId), eq(watchlists.userId, userId)));
  return getWatchlist(userId, watchlistId);
}

export async function deleteWatchlist(userId: string, watchlistId: string) {
  await db.delete(watchlists).where(and(eq(watchlists.id, watchlistId), eq(watchlists.userId, userId)));
}

export async function listItems(watchlistId: string) {
  return db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, watchlistId))
    .orderBy(asc(watchlistItems.addedAt));
}

export async function addItem(watchlistId: string, symbol: string) {
  const id = createId('item');
  await db
    .insert(watchlistItems)
    .values({ id, watchlistId, symbol: symbol.toUpperCase() })
    .onConflictDoNothing();
  await db.update(watchlists).set({ updatedAt: new Date() }).where(eq(watchlists.id, watchlistId));
}

export async function removeItem(watchlistId: string, symbol: string) {
  await db
    .delete(watchlistItems)
    .where(and(eq(watchlistItems.watchlistId, watchlistId), eq(watchlistItems.symbol, symbol.toUpperCase())));
  await db.update(watchlists).set({ updatedAt: new Date() }).where(eq(watchlists.id, watchlistId));
}
