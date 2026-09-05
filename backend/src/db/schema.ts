// Market Pulse — persistence schema (Drizzle ORM / PostgreSQL)
//
// Design notes (full rationale in README "Database schema overview"):
//  - Users are lightweight (demo-session based, see services/authService.ts).
//  - Watchlists live under a user so state survives page refresh, browser
//    restart, and logging in from a different device — it's read from
//    Postgres, never localStorage.
//  - stock_snapshots is an APPEND-ONLY time series: every provider poll
//    inserts a new row instead of overwriting the last one. That is what
//    lets the change timeline and "since you last checked" comparisons be
//    reconstructed from real recorded history instead of an approximation.
//  - user_stock_state is the "last seen" cursor: one row per (user, symbol)
//    holding the price/state the user actually looked at — the direct input
//    to the meaningful-change engine's "since you last checked" signal.
//  - market_events is a denormalized, queryable log of things the change
//    engine decided were noteworthy (threshold crossed, volume spike,
//    provider outage). It backs the timeline and the future "trust through
//    restraint" retrospective (product spec section 2G) without re-deriving
//    history from snapshots on every request.
//
// Why Drizzle instead of Prisma: Prisma's query engine ships as a
// platform-specific native binary fetched from Prisma's CDN at install/build
// time. In this build environment (and in a number of constrained
// deploy targets — some serverless/edge runtimes, locked-down CI, air-gapped
// networks) that download is blocked, which turns "add an ORM" into a
// deployment risk. Drizzle compiles to plain SQL over `pg`, has zero native
// binaries, and gives the same compile-time type safety — a better fit for a
// product whose whole pitch is resilience under provider/infra failure.

import {
  pgTable,
  text,
  timestamp,
  doublePrecision,
  integer,
  jsonb,
  uniqueIndex,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const sensitivityEnum = pgEnum('sensitivity', ['CALM', 'BALANCED', 'SENSITIVE']);
export const freshnessEnum = pgEnum('freshness', ['FRESH', 'DELAYED', 'STALE', 'UNAVAILABLE']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull().default('Demo User'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  'sessions',
  {
    token: text('token').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => ({
    byUser: index('sessions_user_idx').on(t.userId),
  }),
);

export const userSettings = pgTable('user_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  attentionBudget: integer('attention_budget').notNull().default(3), // 1, 3, 5, or -1 = "everything"
  sensitivity: sensitivityEnum('sensitivity').notNull().default('BALANCED'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const watchlists = pgTable(
  'watchlists',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUser: index('watchlists_user_idx').on(t.userId),
  }),
);

export const watchlistItems = pgTable(
  'watchlist_items',
  {
    id: text('id').primaryKey(),
    watchlistId: text('watchlist_id').notNull().references(() => watchlists.id, { onDelete: 'cascade' }),
    symbol: text('symbol').notNull(),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    unique: uniqueIndex('watchlist_items_watchlist_symbol_idx').on(t.watchlistId, t.symbol),
    bySymbol: index('watchlist_items_symbol_idx').on(t.symbol),
  }),
);

export const stockSnapshots = pgTable(
  'stock_snapshots',
  {
    id: text('id').primaryKey(),
    symbol: text('symbol').notNull(),
    price: doublePrecision('price').notNull(),
    dayChangePercent: doublePrecision('day_change_percent').notNull(),
    volumeRatio: doublePrecision('volume_ratio').notNull(),
    dayHigh: doublePrecision('day_high'),
    dayLow: doublePrecision('day_low'),
    sector: text('sector'),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    provider: text('provider').notNull(),
    freshness: freshnessEnum('freshness').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    bySymbolTime: index('stock_snapshots_symbol_time_idx').on(t.symbol, t.timestamp),
  }),
);

export const userStockState = pgTable(
  'user_stock_state',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    symbol: text('symbol').notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    lastSeenPrice: doublePrecision('last_seen_price'),
    lastSeenChangePct: doublePrecision('last_seen_change_pct'),
    lastSeenSnapshotId: text('last_seen_snapshot_id'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    unique: uniqueIndex('user_stock_state_user_symbol_idx').on(t.userId, t.symbol),
    bySymbol: index('user_stock_state_symbol_idx').on(t.symbol),
  }),
);

export const marketEvents = pgTable(
  'market_events',
  {
    id: text('id').primaryKey(),
    symbol: text('symbol').notNull(),
    type: text('type').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata'),
  },
  (t) => ({
    bySymbolTime: index('market_events_symbol_time_idx').on(t.symbol, t.timestamp),
  }),
);

export const instruments = pgTable(
  'instruments',
  {
    symbol: text('symbol').primaryKey(),
    name: text('name').notNull(),
    sector: text('sector').notNull(),
  },
  (t) => ({
    bySector: index('instruments_sector_idx').on(t.sector),
  }),
);
