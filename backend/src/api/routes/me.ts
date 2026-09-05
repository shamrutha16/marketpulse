// Bootstraps a first watchlist for brand-new sessions so the very first
// screen a user sees is never an empty shell with no obvious next step —
// but only ever creates it once (idempotent per user), never resets an
// existing user's data.
import { Router } from 'express';
import { createWatchlist, listWatchlists } from '../../repositories/watchlistRepository';
import { addItem } from '../../repositories/watchlistRepository';
import { asyncRoute } from '../../middleware/errorHandler';

export const meRouter = Router();

const STARTER_SYMBOLS = ['RELIANCE', 'ONGC', 'IOC', 'TCS', 'INFY', 'WIPRO', 'HCLTECH', 'HDFCBANK', 'ADANIPOWER'];

meRouter.get(
  '/me/bootstrap',
  asyncRoute(async (req, res) => {
    let lists = await listWatchlists(req.userId);
    if (lists.length === 0) {
      const created = await createWatchlist(req.userId, 'My Watchlist');
      if (created) {
        await Promise.all(STARTER_SYMBOLS.map((s) => addItem(created.id, s)));
      }
      lists = await listWatchlists(req.userId);
    }
    res.json({ userId: req.userId, watchlists: lists });
  }),
);
