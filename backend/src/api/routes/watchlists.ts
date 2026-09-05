import { Router } from 'express';
import {
  addItem,
  createWatchlist,
  deleteWatchlist,
  getWatchlist,
  listItems,
  listWatchlists,
  removeItem,
  renameWatchlist,
} from '../../repositories/watchlistRepository';
import { getInstrument } from '../../repositories/instrumentRepository';
import { computeWatchlistInsights, markSymbolSeen, previewSensitivity } from '../../services/insightsService';
import { getQuotes } from '../../services/marketService';
import { asyncRoute, ApiError } from '../../middleware/errorHandler';
import { addItemSchema, createWatchlistSchema, renameWatchlistSchema } from '../schemas';

export const watchlistsRouter = Router();

watchlistsRouter.get(
  '/watchlists',
  asyncRoute(async (req, res) => {
    const lists = await listWatchlists(req.userId);
    res.json({ watchlists: lists });
  }),
);

watchlistsRouter.post(
  '/watchlists',
  asyncRoute(async (req, res) => {
    const { name } = createWatchlistSchema.parse(req.body);
    const watchlist = await createWatchlist(req.userId, name);
    res.status(201).json({ watchlist });
  }),
);

watchlistsRouter.patch(
  '/watchlists/:id',
  asyncRoute(async (req, res) => {
    const existing = await getWatchlist(req.userId, req.params.id);
    if (!existing) throw new ApiError(404, 'Watchlist not found.', 'NOT_FOUND');
    const { name } = renameWatchlistSchema.parse(req.body);
    const watchlist = await renameWatchlist(req.userId, req.params.id, name);
    res.json({ watchlist });
  }),
);

watchlistsRouter.delete(
  '/watchlists/:id',
  asyncRoute(async (req, res) => {
    const existing = await getWatchlist(req.userId, req.params.id);
    if (!existing) throw new ApiError(404, 'Watchlist not found.', 'NOT_FOUND');
    await deleteWatchlist(req.userId, req.params.id);
    res.status(204).end();
  }),
);

watchlistsRouter.get(
  '/watchlists/:id/items',
  asyncRoute(async (req, res) => {
    const watchlist = await getWatchlist(req.userId, req.params.id);
    if (!watchlist) throw new ApiError(404, 'Watchlist not found.', 'NOT_FOUND');
    const items = await listItems(watchlist.id);
    const symbols = items.map((i) => i.symbol);
    const quotes = await getQuotes(symbols);
    const withQuotes = await Promise.all(
      items.map(async (item) => ({
        ...item,
        instrument: await getInstrument(item.symbol),
        quote: quotes.get(item.symbol) ?? null,
      })),
    );
    res.json({ items: withQuotes });
  }),
);

watchlistsRouter.post(
  '/watchlists/:id/items',
  asyncRoute(async (req, res) => {
    const watchlist = await getWatchlist(req.userId, req.params.id);
    if (!watchlist) throw new ApiError(404, 'Watchlist not found.', 'NOT_FOUND');
    const { symbol } = addItemSchema.parse(req.body);
    const instrument = await getInstrument(symbol.toUpperCase());
    if (!instrument) throw new ApiError(422, `Unknown symbol "${symbol}".`, 'UNKNOWN_SYMBOL');
    await addItem(watchlist.id, symbol);
    const items = await listItems(watchlist.id);
    res.status(201).json({ items });
  }),
);

watchlistsRouter.delete(
  '/watchlists/:id/items/:symbol',
  asyncRoute(async (req, res) => {
    const watchlist = await getWatchlist(req.userId, req.params.id);
    if (!watchlist) throw new ApiError(404, 'Watchlist not found.', 'NOT_FOUND');
    await removeItem(watchlist.id, req.params.symbol);
    res.status(204).end();
  }),
);

watchlistsRouter.get(
  '/watchlists/:id/insights',
  asyncRoute(async (req, res) => {
    const watchlist = await getWatchlist(req.userId, req.params.id);
    if (!watchlist) throw new ApiError(404, 'Watchlist not found.', 'NOT_FOUND');
    const items = await listItems(watchlist.id);
    const result = await computeWatchlistInsights(req.userId, items.map((i) => i.symbol));
    res.json(result);
  }),
);

watchlistsRouter.get(
  '/watchlists/:id/sensitivity-preview',
  asyncRoute(async (req, res) => {
    const watchlist = await getWatchlist(req.userId, req.params.id);
    if (!watchlist) throw new ApiError(404, 'Watchlist not found.', 'NOT_FOUND');
    const items = await listItems(watchlist.id);
    const preview = await previewSensitivity(items.map((i) => i.symbol));
    res.json({ preview });
  }),
);

watchlistsRouter.post(
  '/watchlists/:id/mark-seen',
  asyncRoute(async (req, res) => {
    const watchlist = await getWatchlist(req.userId, req.params.id);
    if (!watchlist) throw new ApiError(404, 'Watchlist not found.', 'NOT_FOUND');
    const items = await listItems(watchlist.id);
    await Promise.all(items.map((i) => markSymbolSeen(req.userId, i.symbol)));
    res.status(204).end();
  }),
);
