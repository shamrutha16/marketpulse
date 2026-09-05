import { describe, expect, it } from 'vitest';
import { computeChangeVerdict } from './changeEngine';
import type { AttentionSettings, LastSeenState, PriceSnapshot } from './types';

const BALANCED: AttentionSettings = { sensitivity: 'BALANCED', attentionBudget: 3 };
const CALM: AttentionSettings = { sensitivity: 'CALM', attentionBudget: 3 };
const SENSITIVE: AttentionSettings = { sensitivity: 'SENSITIVE', attentionBudget: 3 };

function snapshot(overrides: Partial<PriceSnapshot> = {}): PriceSnapshot {
  return {
    symbol: 'RELIANCE',
    price: 1478,
    dayChangePercent: 4.8,
    volumeRatio: 1.0,
    timestamp: new Date().toISOString(),
    provider: 'demo',
    freshness: 'FRESH',
    ...overrides,
  };
}

function lastSeen(overrides: Partial<LastSeenState> = {}): LastSeenState {
  return { seenAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), price: 1410, changePercent: 1.2, ...overrides };
}

describe('computeChangeVerdict', () => {
  it('returns STABLE for a small move with no volume/peer signal', () => {
    const v = computeChangeVerdict(
      snapshot({ price: 1414, dayChangePercent: 0.3 }),
      lastSeen({ price: 1410 }),
      BALANCED,
    );
    expect(v.level).toBe('STABLE');
    expect(v.changed).toBe(false);
  });

  it('flags a large move since last seen as NEEDS_ATTENTION', () => {
    const v = computeChangeVerdict(snapshot({ price: 1478 }), lastSeen({ price: 1410 }), BALANCED);
    expect(v.level).toBe('NEEDS_ATTENTION');
    expect(v.sinceLastChecked?.basis).toBe('LAST_SEEN');
    expect(v.reasons.some((r) => r.includes('since you last checked'))).toBe(true);
  });

  it('treats first-time viewers using day change, not a fabricated last-seen delta', () => {
    const v = computeChangeVerdict(
      snapshot({ price: 1478, dayChangePercent: 4.8 }),
      { seenAt: null, price: null, changePercent: null },
      BALANCED,
    );
    expect(v.isFirstView).toBe(true);
    expect(v.sinceLastChecked?.basis).toBe('DAY_OPEN');
    expect(v.level).not.toBe('STABLE');
  });

  it('boosts score for unusual volume on top of a moderate price move', () => {
    const withoutVolume = computeChangeVerdict(
      snapshot({ price: 1440, volumeRatio: 1.0 }),
      lastSeen({ price: 1410 }),
      BALANCED,
    );
    const withVolume = computeChangeVerdict(
      snapshot({ price: 1440, volumeRatio: 2.5 }),
      lastSeen({ price: 1410 }),
      BALANCED,
    );
    expect(withVolume.score).toBeGreaterThan(withoutVolume.score);
    expect(withVolume.reasons.some((r) => r.includes('normal'))).toBe(true);
  });

  it('is more sensitive under SENSITIVE and less under CALM for the same input', () => {
    const snap = snapshot({ price: 1435 });
    const seen = lastSeen({ price: 1410 });
    const calm = computeChangeVerdict(snap, seen, CALM);
    const sensitive = computeChangeVerdict(snap, seen, SENSITIVE);
    const levelRank = { STABLE: 0, WORTH_WATCHING: 1, MEANINGFUL_CHANGE: 2, NEEDS_ATTENTION: 3 };
    expect(levelRank[sensitive.level]).toBeGreaterThanOrEqual(levelRank[calm.level]);
  });

  it('never fabricates a live verdict when the provider is unavailable', () => {
    const v = computeChangeVerdict(
      snapshot({ freshness: 'UNAVAILABLE' }),
      lastSeen({ price: 1410 }),
      BALANCED,
    );
    expect(v.level).toBe('STABLE');
    expect(v.changed).toBe(false);
    expect(v.reasons[0]).toMatch(/unavailable/i);
  });

  it('dampens score and adds a caveat when data is stale, but still reports a verdict', () => {
    const v = computeChangeVerdict(
      snapshot({ price: 1478, freshness: 'STALE' }),
      lastSeen({ price: 1410 }),
      BALANCED,
    );
    expect(v.reasons[0]).toMatch(/stale/i);
    expect(v.level).not.toBe('NEEDS_ATTENTION'); // capped one band down
  });

  it('pushes peer-underperformance above a similar-magnitude sector-driven move', () => {
    const sectorDriven = computeChangeVerdict(
      snapshot({ symbol: 'RELIANCE', price: 1435.5, dayChangePercent: -3.2 }),
      lastSeen({ price: 1483, changePercent: -3.2 }),
      BALANCED,
      { sectorMovePercent: -2.9, relativeMovePercent: -0.3, interpretation: 'Movement appears broadly sector-driven.', confidence: 'HIGH' },
    );
    const underperforming = computeChangeVerdict(
      snapshot({ symbol: 'INFY', price: 1454.5, dayChangePercent: -3.1 }),
      lastSeen({ price: 1501, changePercent: -3.1 }),
      BALANCED,
      { sectorMovePercent: -0.4, relativeMovePercent: -2.7, interpretation: 'Underperformed its sector (sector average -0.4%).', confidence: 'HIGH' },
    );
    expect(underperforming.score).toBeGreaterThan(sectorDriven.score);
  });

  it('does not re-surface a change that happened entirely before the last visit', () => {
    const staleNews = computeChangeVerdict(
      snapshot({ price: 1410.5, dayChangePercent: 0.1, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() }),
      lastSeen({ price: 1410, seenAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() }),
      BALANCED,
    );
    expect(staleNews.reasons.some((r) => r.includes('after your last visit'))).toBe(false);
  });
});
