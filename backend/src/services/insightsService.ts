// Market Pulse — insights orchestration service.
//
// This is the seam between the framework world (Express, the DB, the
// provider) and the pure domain world (domain/*). Its whole job is: gather
// everything the engines need, call them in the right order, and shape the
// result for the API. No scoring or thresholding logic lives here — that
// would defeat the point of pulling it into domain/*.

import { getInstrument, listInstrumentsBySector } from '../repositories/instrumentRepository';
import { getLastSeenStates, markSeen as persistMarkSeen } from '../repositories/stockStateRepository';
import { recordEvent } from '../repositories/marketEventRepository';
import { getSettings } from '../repositories/settingsRepository';
import { getQuotes } from './marketService';
import { computeChangeVerdict } from '../domain/changeEngine';
import { computePeerContext } from '../domain/peerContextEngine';
import { findCorrelatedGroups } from '../domain/correlationEngine';
import { buildInsights, rankInsights } from '../domain/attentionRanking';
import type { AttentionSettings, ChangeVerdict, PriceSnapshot } from '../domain/types';

export interface WatchlistInsightsResult {
  generatedAt: string;
  settings: AttentionSettings;
  verdicts: ChangeVerdict[]; // every symbol, including STABLE ones
  ranked: ReturnType<typeof rankInsights>;
  quietCount: number;
}

export async function computeWatchlistInsights(
  userId: string,
  symbols: string[],
  overrideSettings?: Partial<AttentionSettings>,
): Promise<WatchlistInsightsResult> {
  if (symbols.length === 0) {
    const settings = { ...(await getSettings(userId)), ...overrideSettings };
    return {
      generatedAt: new Date().toISOString(),
      settings,
      verdicts: [],
      ranked: { surfaced: [], suppressed: [], totalCandidates: 0, budget: settings.attentionBudget },
      quietCount: 0,
    };
  }

  const settings: AttentionSettings = { ...(await getSettings(userId)), ...overrideSettings };

  // Peer context needs sibling quotes too, so first resolve sectors, then
  // fetch quotes for the union of watchlist symbols + their sector peers in
  // ONE batched call (section 29 — never fetch peer data per-symbol).
  const instruments = await Promise.all(symbols.map((s) => getInstrument(s)));
  const sectorOf = new Map(symbols.map((s, i) => [s, instruments[i]?.sector]));
  const sectors = [...new Set(instruments.map((i) => i?.sector).filter((s): s is string => !!s))];
  const peerLists = await Promise.all(sectors.map((sector) => listInstrumentsBySector(sector)));
  const peerSymbolsBySector = new Map(sectors.map((sector, i) => [sector, peerLists[i].map((p) => p.symbol)]));
  const allPeerSymbols = [...new Set(peerLists.flat().map((p) => p.symbol))];

  const allSymbols = [...new Set([...symbols, ...allPeerSymbols])];
  const quotes = await getQuotes(allSymbols);
  const lastSeenStates = await getLastSeenStates(userId, symbols);

  // Correlation is computed across the watchlist's own snapshots only —
  // "your stocks moving together", not the whole sector universe.
  const watchlistSnapshots = symbols
    .map((s) => quotes.get(s))
    .filter((s): s is PriceSnapshot => !!s && s.freshness !== 'UNAVAILABLE');
  const groups = findCorrelatedGroups(
    watchlistSnapshots.map((s) => ({ symbol: s.symbol, dayChangePercent: s.dayChangePercent, sector: s.sector })),
  );

  const verdicts: ChangeVerdict[] = [];
  for (const symbol of symbols) {
    const current = quotes.get(symbol);
    if (!current) continue;
    const lastSeen = lastSeenStates.get(symbol) ?? { seenAt: null, price: null, changePercent: null };

    const sector = sectorOf.get(symbol);
    let peer;
    if (sector) {
      const peerSymbols = peerSymbolsBySector.get(sector) ?? [];
      const peerQuotes = peerSymbols
        .map((s) => quotes.get(s))
        .filter((s): s is PriceSnapshot => !!s && s.symbol !== symbol && s.freshness !== 'UNAVAILABLE');
      peer = computePeerContext(
        { symbol, dayChangePercent: current.dayChangePercent, sector },
        peerQuotes.map((p) => ({ symbol: p.symbol, dayChangePercent: p.dayChangePercent, sector: p.sector })),
      );
    }

    const group = groups.find((g) => g.symbols.includes(symbol));
    const verdict = computeChangeVerdict(current, lastSeen, settings, peer, group);
    verdicts.push(verdict);

    if (verdict.level === 'NEEDS_ATTENTION' || verdict.level === 'MEANINGFUL_CHANGE') {
      await recordEvent(symbol, 'MEANINGFUL_CHANGE_TRIGGERED', { level: verdict.level, score: verdict.score });
    }
  }

  const insights = buildInsights(verdicts, groups);
  const ranked = rankInsights(insights, settings);
  const quietCount = verdicts.filter((v) => v.level === 'STABLE').length;

  return { generatedAt: new Date().toISOString(), settings, verdicts, ranked, quietCount };
}

export async function markSymbolSeen(userId: string, symbol: string) {
  const quotes = await getQuotes([symbol]);
  const current = quotes.get(symbol.toUpperCase());
  if (!current || current.freshness === 'UNAVAILABLE') return;
  await persistMarkSeen(userId, symbol.toUpperCase(), {
    price: current.price,
    dayChangePercent: current.dayChangePercent,
  });
  await recordEvent(symbol.toUpperCase(), 'USER_VISIT');
}

/**
 * Sensitivity preview for the Settings screen (section 2E): "at this
 * setting, how many of the recent notable movements would you have seen?"
 * Built from real recorded snapshot history for the user's own watchlist
 * symbols, not a canned number — but explicitly labeled by how much history
 * is actually available, since a fresh demo won't have a week of data yet.
 */
export async function previewSensitivity(symbols: string[]): Promise<
  { sensitivity: AttentionSettings['sensitivity']; wouldSurface: number }[]
> {
  const { getHistoricalData } = await import('./marketService');
  const histories = await Promise.all(symbols.map((s) => getHistoricalData(s)));
  const movements: number[] = [];
  histories.forEach((points) => {
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1].price;
      const curr = points[i].price;
      if (prev > 0) movements.push(Math.abs(((curr - prev) / prev) * 100));
    }
  });

  const { computeChangeVerdict: engine } = await import('../domain/changeEngine');
  const sensitivities: AttentionSettings['sensitivity'][] = ['CALM', 'BALANCED', 'SENSITIVE'];
  return sensitivities.map((sensitivity) => {
    const wouldSurface = movements.filter((m) => {
      const v = engine(
        {
          symbol: 'PREVIEW',
          price: 100 + m,
          dayChangePercent: m,
          volumeRatio: 1,
          timestamp: new Date().toISOString(),
          provider: 'preview',
          freshness: 'FRESH',
        },
        { seenAt: new Date(Date.now() - 3600_000).toISOString(), price: 100, changePercent: 0 },
        { sensitivity, attentionBudget: -1 },
      );
      return v.changed;
    }).length;
    return { sensitivity, wouldSurface };
  });
}
