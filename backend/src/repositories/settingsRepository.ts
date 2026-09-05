import { eq } from 'drizzle-orm';
import { createId } from '../utils/id';
import { db } from '../db/client';
import { userSettings } from '../db/schema';
import type { AttentionSettings } from '../domain/types';

export async function getSettings(userId: string): Promise<AttentionSettings> {
  const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  if (!row) {
    await db.insert(userSettings).values({ id: createId('settings'), userId });
    return { sensitivity: 'BALANCED', attentionBudget: 3 };
  }
  return { sensitivity: row.sensitivity, attentionBudget: row.attentionBudget };
}

export async function updateSettings(userId: string, patch: Partial<AttentionSettings>) {
  await getSettings(userId); // ensure row exists
  await db
    .update(userSettings)
    .set({
      ...(patch.sensitivity ? { sensitivity: patch.sensitivity } : {}),
      ...(typeof patch.attentionBudget === 'number' ? { attentionBudget: patch.attentionBudget } : {}),
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId));
  return getSettings(userId);
}
