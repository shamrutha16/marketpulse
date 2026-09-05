// Market Pulse — market data provider abstraction.
//
// Domain logic never talks to a third-party API or a specific data shape
// directly. Everything upstream of this interface is provider-specific;
// everything downstream (domain/*, services/*) only sees normalized
// PriceSnapshot / HistoricalPoint / MarketStatus objects. Swapping providers
// (or falling back from one to another) never touches the change engine.

import type { HistoricalPoint, MarketStatus, PriceSnapshot } from '../domain/types';

export interface MarketDataProvider {
  readonly name: string;
  /** Batched on purpose — see README "Performance" — one round trip for N symbols. */
  getQuotes(symbols: string[]): Promise<Map<string, PriceSnapshot>>;
  getHistoricalData(symbol: string): Promise<HistoricalPoint[]>;
  getMarketStatus(): Promise<MarketStatus>;
}
