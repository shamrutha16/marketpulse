// Market Pulse — real (best-effort) market data provider.
//
// Uses Yahoo Finance's public, unauthenticated CHART endpoint
// (`v8/finance/chart`) for quotes, historical data, and market status. This
// is deliberately the "free public API" option (no signup, no key) rather
// than a paid provider — appropriate for a hackathon submission — but it
// comes with real trade-offs the product has to handle honestly (section
// 28): it's unofficial, undocumented, and can rate-limit, change shape, or
// go down without notice. Every one of those failure modes degrades to a
// clearly-labeled STALE/UNAVAILABLE snapshot built from the last good
// reading — never a silent fake "live" number (section 12/49).
//
// Why `v8/finance/chart` and not the old `v7/finance/quote` batch endpoint:
// sometime in 2023-2024 Yahoo locked v7/finance/quote behind a session
// cookie + rotating "crumb" token — calling it without one now returns
// `401 {"finance":{"error":{"code":"Unauthorized","description":"Invalid
// Crumb"}}}`. Standing up a scraped-cookie/crumb session (visit
// finance.yahoo.com, parse a crumb out of the HTML or a consent flow, retry
// on expiry) is exactly the kind of fragile, credential-adjacent
// infrastructure a 72-hour build shouldn't lean on — and it can still break
// without notice since it's scraping Yahoo's login/consent flow, not a
// documented API. `v8/finance/chart/<symbol>` has stayed reachable with
// nothing but a browser User-Agent, and its `meta` block carries everything
// this app needs (live price, previous close, day high/low, volume), so
// quotes are fetched from there instead — per symbol, since chart has no
// multi-symbol batch mode, with bounded concurrency (`QUOTE_CONCURRENCY`)
// so a large watchlist never fires dozens of simultaneous requests at
// Yahoo. This is still "batched" in the sense that matters for this app:
// marketService's process-wide cache (8s TTL) means this fan-out happens
// once per 8 seconds for the *entire* user base, not once per request.
//
// Indian equities are queried as `${symbol}.NS` (NSE). If a symbol isn't
// resolvable, its snapshot comes back UNAVAILABLE for that call rather than
// failing the whole batch.

import type { HistoricalPoint, MarketStatus, PriceSnapshot } from '../domain/types';
import { INSTRUMENT_BY_SYMBOL } from '../config/instruments';
import type { MarketDataProvider } from './MarketDataProvider';
import { logger } from '../utils/logger';

const CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const FETCH_TIMEOUT_MS = 6000;
const STALE_AFTER_MS = 5 * 60 * 1000;
/** Don't fan out unbounded — be a polite, hard-to-rate-limit scraper. */
const QUOTE_CONCURRENCY = 5;

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json,text/plain,*/*',
};

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal, headers: BROWSER_HEADERS });
  } finally {
    clearTimeout(timer);
  }
}

/** Shape of `chart.result[0]` that we actually read. Yahoo's real payload has more. */
interface ChartResult {
  meta?: {
    regularMarketPrice?: number;
    previousClose?: number;
    chartPreviousClose?: number;
    regularMarketDayHigh?: number;
    regularMarketDayLow?: number;
    regularMarketVolume?: number;
    regularMarketTime?: number;
    marketState?: string;
  };
  indicators?: { quote?: [{ volume?: (number | null)[]; close?: (number | null)[] }] };
  timestamp?: number[];
}

async function fetchChart(symbol: string, interval: string, range: string): Promise<ChartResult> {
  const res = await fetchWithTimeout(
    `${CHART_URL}/${encodeURIComponent(`${symbol}.NS`)}?interval=${interval}&range=${range}`,
  );
  if (!res.ok) throw new Error(`Yahoo chart endpoint returned ${res.status}`);
  const body = (await res.json()) as any;
  const error = body?.chart?.error;
  const result = body?.chart?.result?.[0];
  if (error) throw new Error(error.description ?? 'Yahoo chart endpoint returned an error');
  if (!result?.meta) throw new Error('Yahoo chart endpoint returned no result');
  return result as ChartResult;
}

export class YahooMarketDataProvider implements MarketDataProvider {
  readonly name = 'yahoo';
  private lastGood = new Map<string, PriceSnapshot>();

  async getQuotes(symbols: string[]): Promise<Map<string, PriceSnapshot>> {
    const result = new Map<string, PriceSnapshot>();
    if (symbols.length === 0) return result;

    const queue = [...symbols];
    const workerCount = Math.min(QUOTE_CONCURRENCY, queue.length);
    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        let symbol: string | undefined;
        // eslint-disable-next-line no-cond-assign
        while ((symbol = queue.shift())) {
          result.set(symbol, await this.fetchOneQuote(symbol));
        }
      }),
    );

    return result;
  }

  private async fetchOneQuote(symbol: string): Promise<PriceSnapshot> {
    try {
      // Daily bars over the last month: `meta` still carries the *live*
      // regularMarketPrice/DayHigh/DayLow regardless of interval/range, and
      // the daily volume series lets us approximate a volume ratio (today's
      // bar vs. the trailing ~20 sessions) in this same request rather than
      // firing a second one.
      const chart = await fetchChart(symbol, '1d', '1mo');
      const meta = chart.meta!;
      const price = meta.regularMarketPrice;
      if (typeof price !== 'number') throw new Error('no regularMarketPrice in response');

      const previousClose = meta.previousClose ?? meta.chartPreviousClose;
      const dayChangePercent =
        typeof previousClose === 'number' && previousClose > 0
          ? ((price - previousClose) / previousClose) * 100
          : 0;

      const snapshot: PriceSnapshot = {
        symbol,
        price,
        dayChangePercent,
        volumeRatio: computeVolumeRatioFromDailySeries(chart, meta.regularMarketVolume),
        dayHigh: meta.regularMarketDayHigh,
        dayLow: meta.regularMarketDayLow,
        sector: INSTRUMENT_BY_SYMBOL.get(symbol)?.sector,
        timestamp: meta.regularMarketTime
          ? new Date(meta.regularMarketTime * 1000).toISOString()
          : new Date().toISOString(),
        provider: this.name,
        freshness: classifyFreshness(meta.regularMarketTime),
      };
      this.lastGood.set(symbol, snapshot);
      return snapshot;
    } catch (err) {
      logger.warn({ err, symbol }, 'Yahoo provider quote fetch failed; degrading to last-known state');
      return this.degrade(symbol, 'UNAVAILABLE');
    }
  }

  private degrade(symbol: string, freshness: PriceSnapshot['freshness']): PriceSnapshot {
    const prior = this.lastGood.get(symbol);
    if (prior) return { ...prior, freshness };
    return {
      symbol,
      price: 0,
      dayChangePercent: 0,
      volumeRatio: 1,
      sector: INSTRUMENT_BY_SYMBOL.get(symbol)?.sector,
      timestamp: new Date().toISOString(),
      provider: this.name,
      freshness: 'UNAVAILABLE',
    };
  }

  async getHistoricalData(symbol: string): Promise<HistoricalPoint[]> {
    try {
      const chart = await fetchChart(symbol, '5m', '1d');
      const timestamps = chart.timestamp ?? [];
      const closes = chart.indicators?.quote?.[0]?.close ?? [];
      return timestamps
        .map((t, i) => ({ timestamp: new Date(t * 1000).toISOString(), price: closes[i] }))
        .filter((p): p is HistoricalPoint => typeof p.price === 'number');
    } catch (err) {
      logger.warn({ err, symbol }, 'Yahoo provider historical data failed');
      return [];
    }
  }

  async getMarketStatus(): Promise<MarketStatus> {
    try {
      const chart = await fetchChart('RELIANCE', '1d', '1d');
      const state = chart.meta?.marketState;
      return {
        isOpen: state === 'REGULAR',
        session: state === 'REGULAR' ? 'OPEN' : state === 'PRE' ? 'PRE_OPEN' : 'CLOSED',
        asOf: new Date().toISOString(),
      };
    } catch {
      return { isOpen: false, session: 'CLOSED', asOf: new Date().toISOString() };
    }
  }
}

/**
 * Approximates "today's volume ÷ trailing average" from a single daily-bar
 * chart response: the last entry in the volume series is today's (partial
 * if the market is still open), and the average of the preceding sessions
 * stands in for the 3-month average the old v7 endpoint gave us directly.
 * Falls back to 1 (neutral) if there isn't enough history to compare.
 */
function computeVolumeRatioFromDailySeries(chart: ChartResult, fallbackVolume?: number): number {
  const volumes = (chart.indicators?.quote?.[0]?.volume ?? []).filter(
    (v): v is number => typeof v === 'number',
  );
  const todayVolume = volumes.length > 0 ? volumes[volumes.length - 1] : fallbackVolume;
  const priorVolumes = volumes.slice(0, -1);
  if (typeof todayVolume !== 'number' || priorVolumes.length === 0) return 1;
  const avgVolume = priorVolumes.reduce((a, b) => a + b, 0) / priorVolumes.length;
  if (avgVolume <= 0) return 1;
  return Math.round((todayVolume / avgVolume) * 100) / 100;
}

function classifyFreshness(regularMarketTimeSec?: number): PriceSnapshot['freshness'] {
  if (!regularMarketTimeSec) return 'DELAYED';
  const ageMs = Date.now() - regularMarketTimeSec * 1000;
  if (ageMs > STALE_AFTER_MS) return 'STALE';
  if (ageMs > 60_000) return 'DELAYED';
  return 'FRESH';
}
