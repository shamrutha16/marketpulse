import { Router } from 'express';
import { pool } from '../../db/client';
import { getMarketDataProvider } from '../../providers';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  let dbOk = true;
  try {
    await pool.query('SELECT 1');
  } catch {
    dbOk = false;
  }
  const provider = getMarketDataProvider();
  res.json({
    status: dbOk ? 'ok' : 'degraded',
    database: dbOk ? 'ok' : 'unreachable',
    provider: provider.name,
    time: new Date().toISOString(),
  });
});
