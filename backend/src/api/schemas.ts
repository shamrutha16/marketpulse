import { z } from 'zod';

export const createWatchlistSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
});

export const renameWatchlistSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
});

export const addItemSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, 'Symbol is required')
    .max(20)
    .regex(/^[A-Za-z&]+$/, 'Symbol must be letters only'),
});

export const updateSettingsSchema = z.object({
  sensitivity: z.enum(['CALM', 'BALANCED', 'SENSITIVE']).optional(),
  attentionBudget: z.union([z.literal(1), z.literal(3), z.literal(5), z.literal(-1)]).optional(),
});

export const chaosSchema = z.object({
  mode: z.enum(['NONE', 'DELAYED', 'STALE', 'UNAVAILABLE']),
  symbols: z.array(z.string()).optional(),
});
