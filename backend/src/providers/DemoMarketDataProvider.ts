// Market Pulse — demo market data provider.
//
// Produces realistic, evolving synthetic market data with NO external network
// call, so the product works offline and is deterministic enough for judging
// (section 25). It is exercised through the exact same MarketDataProvider
// interface as a real provider (section 24/25: "the SAME domain engines must
// process demo and real data") — nothing downstream knows this isn't NSE.
//
// SIMULATION MODEL
// -----------------
// Price is a pure function of wall-clock time elapsed since the process
// started, not accumulated mutable state — so it's reproducible, cheap, and
// (bonus) would work identically across multiple stateless server replicas.
// Elapsed time moves through a small number of scripted "stages" designed to
// exercise every product scenario the spec calls out end-to-end:
//
//   Stage 0 (0-90s):    calm open — tiny moves, normal volume.
//   Stage 1 (90-240s):  Energy sector drops together (correlated group, down).
//   Stage 2 (240-390s): INFY drops hard while IT peers barely move
//                        (peer-relative divergence / "underperformed peers").
//   Stage 3 (390-600s): IT sector rallies together (correlated group, up);
//                        ADANIPOWER gets a volume spike on a modest price
//                        move (needs-attention via volume, not price).
//   Stage 4+ (600s+):   continues drifting from the stage-3 levels with
//                        ordinary noise, so a long-running demo doesn't
//                        replay the same script forever.
//
// FAULT INJECTION
// ----------------
// `setChaosMode` lets the demo simulate the provider going down mid-judging
// (section 49) without restarting the process: DELAYED backdates the
// timestamp, STALE freezes on the last good reading, UNAVAILABLE stops
// updating entirely while still returning the last known values (never a
// blank state). See api/routes/debug.ts for the toggle endpoint.

import type { HistoricalPoint, MarketStatus, PriceSnapshot } from '../domain/types';
import { INSTRUMENTS } from '../config/instruments';
import type { MarketDataProvider } from './MarketDataProvider';

type ChaosMode = 'NONE' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';

interface ScriptedMove {
  // Fraction of the way through the stage window, target %-change-from-base.
  changePercent: number;
  volumeRatio: number;
}

const STAGES_MS = [90_000, 240_000, 390_000, 600_000];

// symbol -> per-stage scripted target (index-aligned with STAGES_MS + a
// trailing "steady state" stage). Symbols not listed drift with pure noise.
const SCRIPT: Record<string, ScriptedMove[]> = {
  RELIANCE: [{ changePercent: 0.4, volumeRatio: 1.0 }, { changePercent: -3.2, volumeRatio: 1.6 }, { changePercent: -3.2, volumeRatio: 1.3 }, { changePercent: -3.0, volumeRatio: 1.1 }, { changePercent: -3.1, volumeRatio: 1.0 }],
  ONGC: [{ changePercent: 0.2, volumeRatio: 1.0 }, { changePercent: -3.0, volumeRatio: 1.5 }, { changePercent: -3.0, volumeRatio: 1.2 }, { changePercent: -2.9, volumeRatio: 1.0 }, { changePercent: -3.0, volumeRatio: 1.0 }],
  IOC: [{ changePercent: -0.1, volumeRatio: 1.0 }, { changePercent: -2.8, volumeRatio: 1.4 }, { changePercent: -2.8, volumeRatio: 1.1 }, { changePercent: -2.7, volumeRatio: 1.0 }, { changePercent: -2.8, volumeRatio: 1.0 }],
  BPCL: [{ changePercent: 0.1, volumeRatio: 0.9 }, { changePercent: -1.1, volumeRatio: 1.1 }, { changePercent: -1.0, volumeRatio: 1.0 }, { changePercent: -0.8, volumeRatio: 1.0 }, { changePercent: -0.9, volumeRatio: 1.0 }],

  INFY: [{ changePercent: -0.2, volumeRatio: 1.0 }, { changePercent: -0.2, volumeRatio: 1.0 }, { changePercent: -3.1, volumeRatio: 1.9 }, { changePercent: 0.4, volumeRatio: 1.2 }, { changePercent: 0.5, volumeRatio: 1.0 }],
  TCS: [{ changePercent: 0.3, volumeRatio: 1.0 }, { changePercent: 0.3, volumeRatio: 1.0 }, { changePercent: -0.3, volumeRatio: 1.0 }, { changePercent: 2.4, volumeRatio: 1.4 }, { changePercent: 2.4, volumeRatio: 1.0 }],
  WIPRO: [{ changePercent: 0.1, volumeRatio: 1.0 }, { changePercent: 0.1, volumeRatio: 1.0 }, { changePercent: -0.4, volumeRatio: 1.0 }, { changePercent: 2.3, volumeRatio: 1.3 }, { changePercent: 2.3, volumeRatio: 1.0 }],
  HCLTECH: [{ changePercent: -0.1, volumeRatio: 1.0 }, { changePercent: -0.1, volumeRatio: 1.0 }, { changePercent: -0.5, volumeRatio: 1.0 }, { changePercent: 2.6, volumeRatio: 1.3 }, { changePercent: 2.6, volumeRatio: 1.0 }],
  TECHM: [{ changePercent: 0.2, volumeRatio: 1.0 }, { changePercent: 0.2, volumeRatio: 1.0 }, { changePercent: -0.2, volumeRatio: 1.0 }, { changePercent: 0.6, volumeRatio: 1.0 }, { changePercent: 0.6, volumeRatio: 1.0 }],

  ADANIPOWER: [{ changePercent: 0.3, volumeRatio: 1.0 }, { changePercent: 0.5, volumeRatio: 1.1 }, { changePercent: 0.8, volumeRatio: 1.2 }, { changePercent: 1.6, volumeRatio: 2.6 }, { changePercent: 1.4, volumeRatio: 1.8 }],
};

const NOISE_AMPLITUDE = 0.18; // pp of price noise
const VOLUME_NOISE_AMPLITUDE = 0.12;
const BUCKET_MS = 12_000; // noise re-rolls every 12s of elapsed time

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic pseudo-random in [-1, 1] for (symbol, bucket). */
function noise(symbol: string, bucket: number): number {
  const seed = hashSeed(`${symbol}:${bucket}`);
  const x = Math.sin(seed) * 10000;
  return (x - Math.floor(x)) * 2 - 1;
}

function stageIndexFor(elapsedMs: number): number {
  for (let i = 0; i < STAGES_MS.length; i++) {
    if (elapsedMs < STAGES_MS[i]) return i;
  }
  return STAGES_MS.length; // steady-state / trailing stage
}

export class DemoMarketDataProvider implements MarketDataProvider {
  readonly name = 'demo';
  private readonly startedAt = Date.now();
  private chaosMode: ChaosMode = 'NONE';
  private chaosSymbols: Set<string> | null = null; // null = all symbols
  private lastGood = new Map<string, PriceSnapshot>();

  setChaosMode(mode: ChaosMode, symbols?: string[]) {
    this.chaosMode = mode;
    this.chaosSymbols = symbols && symbols.length > 0 ? new Set(symbols) : null;
  }

  getChaosState() {
    return { mode: this.chaosMode, symbols: this.chaosSymbols ? [...this.chaosSymbols] : 'all' };
  }

  async getQuotes(symbols: string[]): Promise<Map<string, PriceSnapshot>> {
    const result = new Map<string, PriceSnapshot>();
    const now = Date.now();
    for (const symbol of symbols) {
      const affectedByChaos =
        this.chaosMode !== 'NONE' && (!this.chaosSymbols || this.chaosSymbols.has(symbol));

      if (affectedByChaos && this.chaosMode === 'UNAVAILABLE') {
        const prior = this.lastGood.get(symbol);
        result.set(symbol, {
          ...(prior ?? this.computeFresh(symbol, now)),
          freshness: 'UNAVAILABLE',
        });
        continue;
      }

      if (affectedByChaos && this.chaosMode === 'STALE') {
        const prior = this.lastGood.get(symbol) ?? this.computeFresh(symbol, now);
        result.set(symbol, { ...prior, freshness: 'STALE' });
        continue;
      }

      let snapshot = this.computeFresh(symbol, now);

      if (affectedByChaos && this.chaosMode === 'DELAYED') {
        const backdated = new Date(now - 6 * 60 * 1000).toISOString();
        snapshot = { ...snapshot, timestamp: backdated, freshness: 'DELAYED' };
      }

      this.lastGood.set(symbol, snapshot);
      result.set(symbol, snapshot);
    }
    return result;
  }

  private computeFresh(symbol: string, now: number): PriceSnapshot {
    const instrument = INSTRUMENTS.find((i) => i.symbol === symbol);
    const basePrice = instrument?.basePrice ?? 500;
    const sector = instrument?.sector;
    const elapsed = now - this.startedAt;
    const stage = stageIndexFor(elapsed);
    const script = SCRIPT[symbol];

    const scripted = script ? script[Math.min(stage, script.length - 1)] : undefined;
    const baseChangePercent = scripted ? scripted.changePercent : driftFor(symbol, elapsed);
    const baseVolumeRatio = scripted ? scripted.volumeRatio : 1.0;

    const bucket = Math.floor(elapsed / BUCKET_MS);
    const priceNoise = noise(symbol, bucket) * NOISE_AMPLITUDE;
    const volumeNoise = noise(`${symbol}:vol`, bucket) * VOLUME_NOISE_AMPLITUDE;

    const dayChangePercent = round(baseChangePercent + priceNoise);
    const price = round(basePrice * (1 + dayChangePercent / 100));
    const volumeRatio = round(Math.max(0.2, baseVolumeRatio + volumeNoise));
    const dayHigh = round(Math.max(price, basePrice * (1 + (dayChangePercent + 0.3) / 100)));
    const dayLow = round(Math.min(price, basePrice * (1 + (dayChangePercent - 0.3) / 100)));

    return {
      symbol,
      price,
      dayChangePercent,
      volumeRatio,
      dayHigh,
      dayLow,
      sector,
      timestamp: new Date(now).toISOString(),
      provider: this.name,
      freshness: 'FRESH',
    };
  }

  async getHistoricalData(symbol: string): Promise<HistoricalPoint[]> {
    const instrument = INSTRUMENTS.find((i) => i.symbol === symbol);
    const basePrice = instrument?.basePrice ?? 500;
    const points: HistoricalPoint[] = [];
    const now = Date.now();
    // 60 points at 5-minute spacing (5 hours of intraday-like history),
    // reconstructed the same deterministic way as computeFresh so the
    // sparkline/chart are consistent with the current quote.
    for (let i = 60; i >= 0; i--) {
      const t = now - i * 5 * 60 * 1000;
      const elapsed = Math.max(0, t - this.startedAt);
      const stage = stageIndexFor(elapsed);
      const script = SCRIPT[symbol];
      const scripted = script ? script[Math.min(stage, script.length - 1)] : undefined;
      const base = scripted ? scripted.changePercent : driftFor(symbol, elapsed);
      const bucket = Math.floor(elapsed / BUCKET_MS);
      const n = noise(symbol, bucket) * NOISE_AMPLITUDE;
      points.push({ timestamp: new Date(t).toISOString(), price: round(basePrice * (1 + (base + n) / 100)) });
    }
    return points;
  }

  async getMarketStatus(): Promise<MarketStatus> {
    const now = new Date();
    const hour = now.getUTCHours() + 5.5; // IST offset, approximate
    const istHour = hour % 24;
    const isWeekday = now.getUTCDay() >= 1 && now.getUTCDay() <= 5;
    const isOpen = isWeekday && istHour >= 9.25 && istHour <= 15.5;
    return {
      isOpen,
      session: isOpen ? 'OPEN' : istHour < 9.25 ? 'PRE_OPEN' : 'CLOSED',
      asOf: now.toISOString(),
    };
  }
}

function driftFor(symbol: string, elapsedMs: number): number {
  // Slow, gentle unscripted drift for symbols with no story beat, so every
  // instrument still feels alive rather than frozen at 0%.
  const slow = noise(`${symbol}:drift`, Math.floor(elapsedMs / 60_000)) * 0.6;
  return slow;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
