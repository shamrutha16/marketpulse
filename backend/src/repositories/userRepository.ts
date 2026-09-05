import { eq } from 'drizzle-orm';
import { createId } from '../utils/id';
import { db } from '../db/client';
import { sessions, userSettings, users } from '../db/schema';

const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export async function createUserWithSession() {
  const userId = createId('user');
  await db.insert(users).values({ id: userId });
  await db.insert(userSettings).values({ id: createId('settings'), userId });
  const token = createId('sess');
  await db.insert(sessions).values({
    token,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return { userId, token };
}

export async function resolveSession(token: string | undefined) {
  if (!token) return null;
  const [row] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.token, token));
    return null;
  }
  return { userId: row.userId };
}

export async function extendSession(token: string) {
  await db
    .update(sessions)
    .set({ expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
    .where(eq(sessions.token, token));
}
