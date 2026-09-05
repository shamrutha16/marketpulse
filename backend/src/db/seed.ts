import 'dotenv/config';
import { db, pool } from './client';
import { instruments } from './schema';
import { INSTRUMENTS } from '../config/instruments';

async function main() {
  console.log(`Seeding ${INSTRUMENTS.length} instruments...`);
  for (const i of INSTRUMENTS) {
    await db
      .insert(instruments)
      .values({ symbol: i.symbol, name: i.name, sector: i.sector })
      .onConflictDoUpdate({ target: instruments.symbol, set: { name: i.name, sector: i.sector } });
  }
  console.log('Done.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
