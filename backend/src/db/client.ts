import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://marketpulse:marketpulse@localhost:6543/marketpulse';

export const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });

export type Database = typeof db;
