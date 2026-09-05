// Market Pulse — market data application service.
//
// This is the ONLY place that talks to a MarketDataProvider. It owns:
//   1. A short-lived, process-wide quote cache shared across ALL users
//      (section 29 — 500 users watching TCS should cost one upstream call,
//      not 500) with in-flight request de-duplication so concurrent
//      requests for the same symbol never fan out to the provider twice.
//   2. Persisting every fresh reading as an immutable snapshot row (the
//      time series that powers history/timeline).
//   3. Recording MarketEvents for state transitions the timeline cares
//      about (provider degraded/recovered, threshold crossings are recorded
//      by insightsService which has the verdict).

import { getMarketDataProvider } from '../providers';
import { insertSnapshots } from '../repositories/snapshotRepository';
import { recordEvent } from '../repositories/marketEventRepository';
import { logger } from '../utils/logger';
import type { HistoricalPoint, MarketStatus, PriceSnapshot } from '../domain/types';

const CACHE_TTL_MS = 8_000;

interface CacheEntry {
  snapshot: PriceSnapshot;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<PriceSnapshot>>();
let providerHealthy = true;

/** Batched, cached, de-duplicated quote fetch for an arbitrary set of symbols. */
export async function getQuotes(symbols: string[]): Promise<Map<string, PriceSnapshot>> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const result = new Map<string, PriceSnapshot>();
  const toFetch: string[] = [];
  const now = Date.now();

  for (const symbol of unique) {
    const cached = cache.get(symbol);
    if (cached && cached.expiresAt > now) {
      result.set(symbol, cached.snapshot);
    } else {
      toFetch.push(symbol);
    }
  }

  if (toFetch.length > 0) {
    const notAlreadyInFlight = toFetch.filter((s) => !inFlight.has(s));
    if (notAlreadyInFlight.length > 0) {
      const provider = getMarketDataProvider();
      const promise = provider
        .getQuotes(notAlreadyInFlight)
        .then(async (fresh) => {
          const toPersist: PriceSnapshot[] = [];
          for (const [symbol, snapshot] of fresh) {
            cache.set(symbol, { snapshot, expiresAt: Date.now() + CACHE_TTL_MS });
            if (snapshot.freshness === 'FRESH' || snapshot.freshness === 'DELAYED') {
              toPersist.push(snapshot);
            }
          }
          await noteProviderHealth(fresh);
          if (toPersist.length > 0) await insertSnapshots(toPersist);
          return fresh;
        })
        .catch((err) => {
          logger.error({ err }, 'Market data provider failed for batch');
          throw err;
        });

      for (const symbol of notAlreadyInFlight) {
        inFlight.set(
          symbol,
          promise.then((map) => map.get(symbol)!).finally(() => inFlight.delete(symbol)),
        );
      }
    }

    await Promise.all(
      toFetch.map(async (symbol) => {
        try {
          const snapshot = await inFlight.get(symbol);
          if (snapshot) result.set(symbol, snapshot);
        } catch {
          // Provider threw entirely (e.g. network error with no partial
          // result) — never leave the symbol missing; degrade explicitly
          // instead of letting the caller think it simply wasn't requested.
          result.set(symbol, {
            symbol,
            price: 0,
            dayChangePercent: 0,
            volumeRatio: 1,
            timestamp: new Date().toISOString(),
            provider: 'unknown',
            freshness: 'UNAVAILABLE',
          });
        }
      }),
    );
  }

  return result;
}

async function noteProviderHealth(fresh: Map<string, PriceSnapshot>) {
  const anyUnavailable = [...fresh.values()].some((s) => s.freshness === 'UNAVAILABLE');
  if (anyUnavailable && providerHealthy) {
    providerHealthy = false;
    logger.warn('Market data provider degraded');
    await Promise.all(
      [...fresh.keys()].map((symbol) => recordEvent(symbol, 'PROVIDER_DEGRADED')),
    );
  } else if (!anyUnavailable && !providerHealthy) {
    providerHealthy = true;
    logger.info('Market data provider recovered');
    await Promise.all([...fresh.keys()].map((symbol) => recordEvent(symbol, 'PROVIDER_RECOVERED')));
  }
}

export async function getHistoricalData(symbol: string): Promise<HistoricalPoint[]> {
  return getMarketDataProvider().getHistoricalData(symbol.toUpperCase());
}

export async function getMarketStatus(): Promise<MarketStatus> {
  return getMarketDataProvider().getMarketStatus();
}

export function invalidateCache() {
  cache.clear();
}
