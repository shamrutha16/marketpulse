import { DemoMarketDataProvider } from './DemoMarketDataProvider';
import { YahooMarketDataProvider } from './YahooMarketDataProvider';
import type { MarketDataProvider } from './MarketDataProvider';

let instance: MarketDataProvider | null = null;
let demoInstance: DemoMarketDataProvider | null = null;

/**
 * Selected once, at process start, from MARKET_DATA_MODE. See
 * README "Demo mode" for why "demo" is the default: it is deterministic
 * enough to be judged live, requires no network access or API key, and
 * exercises the exact same domain engines as the real provider would.
 */
export function getMarketDataProvider(): MarketDataProvider {
  if (!instance) {
    const mode = process.env.MARKET_DATA_MODE ?? 'demo';
    if (mode === 'yahoo') {
      instance = new YahooMarketDataProvider();
    } else {
      demoInstance = new DemoMarketDataProvider();
      instance = demoInstance;
    }
  }
  return instance;
}

/** Only present when running in demo mode — used by the debug/chaos routes. */
export function getDemoProviderForDebug(): DemoMarketDataProvider | null {
  getMarketDataProvider();
  return demoInstance;
}
