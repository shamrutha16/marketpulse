// API-level tests for the most important endpoints (product spec section
// 38). These exercise the real Express app + real Postgres (via the same
// DATABASE_URL the dev server uses) — no mocking of the DB layer — because
// the thing worth verifying here is the wiring between routes, repositories,
// and the domain engines, not any one of them in isolation (those have
// their own pure unit tests in domain/*.test.ts).
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

function agent() {
  return request.agent(app);
}

describe('API', () => {
  it('GET /api/health reports ok with a reachable database', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('bootstraps a starter watchlist for a brand-new session and persists it across requests', async () => {
    const client = agent();
    const first = await client.get('/api/me/bootstrap');
    expect(first.status).toBe(200);
    expect(first.body.watchlists).toHaveLength(1);
    const watchlistId = first.body.watchlists[0].id;

    // Same cookie jar => same user => same watchlist, not a second one.
    const second = await client.get('/api/me/bootstrap');
    expect(second.body.watchlists).toHaveLength(1);
    expect(second.body.watchlists[0].id).toBe(watchlistId);
  });

  it('issues exactly one session for a brand-new request, even when the first matching route lives in a later-mounted router', async () => {
    // Regression test: sessionMiddleware must be mounted once for the whole
    // /api surface. Mounting it per-router at the same prefix used to mean
    // a fresh (cookieless) request that falls through several routers
    // before matching (e.g. straight to a /watchlists/:id route) minted a
    // new session at EVERY mount, leaving the route handler's userId and
    // the cookie the browser ends up storing pointing at different users.
    const client = agent();
    const res = await client.post('/api/watchlists').send({ name: 'Direct hit' });
    expect(res.status).toBe(201);
    const setCookieHeader = res.headers['set-cookie'];
    const cookieCount = Array.isArray(setCookieHeader) ? setCookieHeader.length : setCookieHeader ? 1 : 0;
    expect(cookieCount).toBe(1);

    // And the watchlist created under that one session must be immediately
    // visible through the same cookie jar.
    const listed = await client.get('/api/watchlists');
    expect(listed.body.watchlists.some((w: any) => w.id === res.body.watchlist.id)).toBe(true);
  });

  it('rejects a watchlist name that fails validation with 400', async () => {
    const client = agent();
    await client.get('/api/me/bootstrap');
    const res = await client.post('/api/watchlists').send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates a watchlist, adds a known symbol, and rejects an unknown one', async () => {
    const client = agent();
    await client.get('/api/me/bootstrap');
    const created = await client.post('/api/watchlists').send({ name: 'Tech' });
    expect(created.status).toBe(201);
    const watchlistId = created.body.watchlist.id;

    const added = await client.post(`/api/watchlists/${watchlistId}/items`).send({ symbol: 'tcs' });
    expect(added.status).toBe(201);
    expect(added.body.items.map((i: any) => i.symbol)).toContain('TCS');

    const rejected = await client.post(`/api/watchlists/${watchlistId}/items`).send({ symbol: 'NOTREAL' });
    expect(rejected.status).toBe(422);
  });

  it('returns 404 for a watchlist that does not belong to the caller', async () => {
    const owner = agent();
    await owner.get('/api/me/bootstrap');
    const created = await owner.post('/api/watchlists').send({ name: 'Private' });

    const stranger = agent();
    await stranger.get('/api/me/bootstrap');
    const res = await stranger.get(`/api/watchlists/${created.body.watchlist.id}/items`);
    expect(res.status).toBe(404);
  });

  it('computes insights for a watchlist and marking seen updates the last-seen basis', async () => {
    const client = agent();
    await client.get('/api/me/bootstrap');
    const created = await client.post('/api/watchlists').send({ name: 'Insights' });
    const watchlistId = created.body.watchlist.id;
    await client.post(`/api/watchlists/${watchlistId}/items`).send({ symbol: 'RELIANCE' });

    const before = await client.get(`/api/watchlists/${watchlistId}/insights`);
    expect(before.status).toBe(200);
    const beforeVerdict = before.body.verdicts.find((v: any) => v.symbol === 'RELIANCE');
    expect(beforeVerdict.sinceLastChecked.basis).toBe('DAY_OPEN');

    await client.post(`/api/watchlists/${watchlistId}/mark-seen`).expect(204);

    const after = await client.get(`/api/watchlists/${watchlistId}/insights`);
    const afterVerdict = after.body.verdicts.find((v: any) => v.symbol === 'RELIANCE');
    expect(afterVerdict.sinceLastChecked.basis).toBe('LAST_SEEN');
  });

  it('marking a symbol seen twice concurrently does not violate the unique last-seen-state constraint', async () => {
    // Regression test: markSeen used to be a select-then-branch, which is
    // not atomic. Two concurrent requests (e.g. a page firing mark-seen
    // from a duplicated effect, or two tabs) could both see "no row yet"
    // and both attempt an INSERT, tripping the unique (userId, symbol)
    // index. It must now be a single atomic upsert.
    const client = agent();
    await client.get('/api/me/bootstrap');
    const [a, b] = await Promise.all([
      client.post('/api/market/RELIANCE/mark-seen'),
      client.post('/api/market/RELIANCE/mark-seen'),
    ]);
    expect(a.status).toBe(204);
    expect(b.status).toBe(204);
  });

  it('settings round-trip: sensitivity and attention budget persist', async () => {
    const client = agent();
    await client.get('/api/me/bootstrap');
    const patched = await client.patch('/api/settings').send({ sensitivity: 'SENSITIVE', attentionBudget: 5 });
    expect(patched.status).toBe(200);
    expect(patched.body).toMatchObject({ sensitivity: 'SENSITIVE', attentionBudget: 5 });

    const fetched = await client.get('/api/settings');
    expect(fetched.body).toMatchObject({ sensitivity: 'SENSITIVE', attentionBudget: 5 });
  });

  it('search finds instruments by partial symbol or name', async () => {
    const res = await request(app).get('/api/market/search').query({ q: 'info' });
    expect(res.status).toBe(200);
    expect(res.body.results.some((r: any) => r.symbol === 'INFY')).toBe(true);
  });
});
