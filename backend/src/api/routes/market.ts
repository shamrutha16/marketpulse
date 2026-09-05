import { Router } from 'express';
import { getHistoricalData, getMarketStatus, getQuotes } from '../../services/marketService';
import { getInstrument, listInstrumentsBySector, searchInstruments } from '../../repositories/instrumentRepository';
import { getTimeline } from '../../repositories/marketEventRepository';
import { markSymbolSeen } from '../../services/insightsService';
import { asyncRoute, ApiError } from '../../middleware/errorHandler';

export const marketRouter = Router();

marketRouter.get(
  '/market/status',
  asyncRoute(async (_req, res) => {
    res.json(await getMarketStatus());
  }),
);

marketRouter.get(
  '/market/search',
  asyncRoute(async (req, res) => {
    const q = String(req.query.q ?? '').trim();
    if (q.length === 0) return res.json({ results: [] });
    const results = await searchInstruments(q);
    res.json({ results });
  }),
);

marketRouter.get(
  '/market/sector/:sector',
  asyncRoute(async (req, res) => {
    const results = await listInstrumentsBySector(req.params.sector);
    res.json({ results });
  }),
);

marketRouter.get(
  '/market/:symbol',
  asyncRoute(async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const instrument = await getInstrument(symbol);
    if (!instrument) throw new ApiError(404, `Unknown symbol "${symbol}".`, 'UNKNOWN_SYMBOL');
    const quotes = await getQuotes([symbol]);
    res.json({ instrument, quote: quotes.get(symbol) ?? null });
  }),
);

marketRouter.get(
  '/market/:symbol/history',
  asyncRoute(async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const points = await getHistoricalData(symbol);
    res.json({ symbol, points });
  }),
);

marketRouter.get(
  '/market/:symbol/timeline',
  asyncRoute(async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const events = await getTimeline(symbol);
    res.json({ symbol, events });
  }),
);

marketRouter.post(
  '/market/:symbol/mark-seen',
  asyncRoute(async (req, res) => {
    await markSymbolSeen(req.userId, req.params.symbol.toUpperCase());
    res.status(204).end();
  }),
);
