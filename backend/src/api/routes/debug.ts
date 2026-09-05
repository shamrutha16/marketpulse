// Market Pulse — judging/demo utility routes.
//
// These exist purely so the "what happens when the provider goes down"
// engineering test (product spec section 49) can be triggered live during
// judging without restarting the process or editing code. Only meaningful
// in demo mode (there is no real outage to simulate against a live
// provider — you'd just wait for one) and intentionally NOT namespaced
// under /api/watchlists or /api/market so it reads as what it is: a judging
// aid, not a product feature.

import { Router } from 'express';
import { getDemoProviderForDebug } from '../../providers';
import { invalidateCache } from '../../services/marketService';
import { asyncRoute } from '../../middleware/errorHandler';
import { chaosSchema } from '../schemas';

export const debugRouter = Router();

debugRouter.get(
  '/debug/chaos',
  asyncRoute(async (_req, res) => {
    const demo = getDemoProviderForDebug();
    if (!demo) return res.status(409).json({ error: 'Not running in demo mode.' });
    res.json(demo.getChaosState());
  }),
);

debugRouter.post(
  '/debug/chaos',
  asyncRoute(async (req, res) => {
    const demo = getDemoProviderForDebug();
    if (!demo) return res.status(409).json({ error: 'Not running in demo mode.' });
    const { mode, symbols } = chaosSchema.parse(req.body);
    demo.setChaosMode(mode, symbols);
    invalidateCache();
    res.json(demo.getChaosState());
  }),
);
