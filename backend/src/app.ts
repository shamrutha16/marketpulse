import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger';
import { sessionMiddleware } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { healthRouter } from './api/routes/health';
import { watchlistsRouter } from './api/routes/watchlists';
import { marketRouter } from './api/routes/market';
import { settingsRouter } from './api/routes/settings';
import { debugRouter } from './api/routes/debug';
import { meRouter } from './api/routes/me';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    cors({
      origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5544').split(','),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

  app.use('/api', healthRouter);

  // IMPORTANT: sessionMiddleware is mounted exactly once for everything
  // below. Mounting it again per-router at the same '/api' prefix would run
  // it once per router for any request that falls through to a later
  // router (e.g. a fresh, cookieless request matching a /watchlists route) —
  // each invocation would see no cookie yet (cookie-parser only reads the
  // original request headers once) and mint a brand-new session, leaving
  // the route handler's req.userId and the cookie the browser ultimately
  // stores pointing at two different users. One mount, one session, always.
  app.use('/api', sessionMiddleware);
  app.use('/api', meRouter);
  app.use('/api', watchlistsRouter);
  app.use('/api', marketRouter);
  app.use('/api', settingsRouter);
  app.use('/api', debugRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
