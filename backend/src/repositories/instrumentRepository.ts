import { eq, ilike, or } from 'drizzle-orm';
import { db } from '../db/client';
import { instruments } from '../db/schema';

export async function searchInstruments(query: string, limit = 8) {
  const q = `%${query}%`;
  return db
    .select()
    .from(instruments)
    .where(or(ilike(instruments.symbol, q), ilike(instruments.name, q)))
    .limit(limit);
}

export async function getInstrument(symbol: string) {
  const [row] = await db.select().from(instruments).where(eq(instruments.symbol, symbol)).limit(1);
  return row ?? null;
}

export async function listInstrumentsBySector(sector: string) {
  return db.select().from(instruments).where(eq(instruments.sector, sector));
}

export async function listAllInstruments() {
  return db.select().from(instruments);
}
