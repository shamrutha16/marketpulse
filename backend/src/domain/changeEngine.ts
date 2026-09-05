// Market Pulse — the meaningful-change engine.
//
// This is the single most important file in the product. It is a pure
// function: same inputs always produce the same verdict, no I/O, no
// randomness, no ML model, no "AI decided". That's a deliberate choice
// (README "Why deterministic rules instead of AI?") — in a financial
// product, "why was I shown this" has to have a real, inspectable answer,
// not a black-box confidence number.
//
// SIGNAL MODEL
// ------------
// We compute a single explainable `score` (in "percent-equivalent" units,
// roughly: how big a price move would produce this much concern) from up to
// four independent signals:
//
//   1. sinceLastChecked  — |price move since the user's last-seen state|.
//                           This is the headline number in the product
//                           ("+4.8% since you last checked"). For a
//                           first-time viewer there is no last-seen price,
//                           so we fall back to today's change from the day's
//                           open/previous close (`basis: 'DAY_OPEN'`) — we
//                           never fabricate a "since last checked" number.
//   2. volumeAnomaly     — volumeRatio above 1.0x, weighted down (volume
//                           alone rarely justifies attention, but it raises
//                           confidence in a price signal that's already
//                           moving).
//   3. peerDivergence    — how much this stock's move differs from its
//                           sector's average move. This is what lets a
//                           stock-specific move (INFY underperforming IT)
//                           outrank a sector-wide move of similar raw
//                           magnitude (section 2B) even though the raw price
//                           change looks the same.
//   4. recency           — a change that happened after the user's last
//                           visit counts; a change that happened *before*
//                           their last visit (they already saw the
//                           aftermath) does not get re-surfaced.
//
// FRESHNESS GOVERNS EVERYTHING ELSE
// ----------------------------------
// If the incoming snapshot is UNAVAILABLE, we refuse to manufacture a
// verdict from stale numbers: level is forced to STABLE/changed=false and
// the single reason is the outage itself (section 49 — never show fake
// "live" data). STALE data still produces a verdict (the user's watchlist
// must not go blank), but every reason list is prefixed with an explicit
// staleness caveat and the score is dampened, so the system never claims
// more confidence than the data supports.
//
// THRESHOLDS
// ----------
// Levels are assigned from `score` using per-sensitivity thresholds. CALM
// requires a much bigger score to call something NEEDS_ATTENTION; SENSITIVE
// calls it much sooner. This is the deterministic backbone of the
// CALM/SENSITIVE slider (section 2E) — same engine, same signals, different
// cutoffs.

import type {
  AttentionLevel,
  AttentionSettings,
  ChangeVerdict,
  Freshness,
  GroupContext,
  LastSeenState,
  PeerContext,
  PriceSnapshot,
  Sensitivity,
} from './types';

interface SensitivityThresholds {
  watch: number;
  meaningful: number;
  attention: number;
}

/**
 * Score cutoffs, in percent-equivalent units. Tuned by hand against the demo
 * scenarios in providers/demoDataProvider.ts (documented in README
 * "Meaningful-change rules"); not derived from real historical backtests —
 * this is prioritization, not a fitted model, and the thresholds are meant
 * to be legible enough that a person can predict the verdict by eye.
 */
const THRESHOLDS: Record<Sensitivity, SensitivityThresholds> = {
  CALM: { watch: 2.2, meaningful: 4.5, attention: 7.5 },
  BALANCED: { watch: 1.2, meaningful: 2.6, attention: 4.5 },
  SENSITIVE: { watch: 0.6, meaningful: 1.4, attention: 2.6 },
};

const VOLUME_WEIGHT = 1.4;
const PEER_DIVERGENCE_WEIGHT = 0.55;
const UNDERPERFORM_BONUS = 1.4; // pushes stock-specific divergence up a band, see section 2B

export function computeChangeVerdict(
  current: PriceSnapshot,
  lastSeen: LastSeenState,
  settings: AttentionSettings,
  peer?: PeerContext,
  group?: GroupContext,
): ChangeVerdict {
  const isFirstView = lastSeen.seenAt === null || lastSeen.price === null;

  if (current.freshness === 'UNAVAILABLE') {
    return {
      symbol: current.symbol,
      level: 'STABLE',
      changed: false,
      reasons: ['Market data temporarily unavailable — showing your last known state.'],
      score: 0,
      sinceLastChecked: null,
      peerContext: peer,
      groupContext: undefined,
      freshness: current.freshness,
      isFirstView,
    };
  }

  const sinceLastChecked = computeSinceLastChecked(current, lastSeen);
  const reasons: string[] = [];

  // --- Signal 1: magnitude of the change the user hasn't seen yet ---------
  const magnitude = Math.abs(sinceLastChecked.changePercent);
  let score = magnitude;

  if (sinceLastChecked.basis === 'LAST_SEEN') {
    reasons.push(
      `Price moved ${formatPct(sinceLastChecked.changePercent)} since you last checked ${formatSince(
        lastSeen.seenAt,
      )}.`,
    );
  } else if (magnitude > 0) {
    reasons.push(`First time tracking this symbol — today's move is ${formatPct(sinceLastChecked.changePercent)}.`);
  }

  // --- Signal 2: volume anomaly --------------------------------------------
  const volumeExcess = Math.max(0, current.volumeRatio - 1);
  if (volumeExcess > 0.15) {
    score += volumeExcess * VOLUME_WEIGHT;
    reasons.push(`Volume is ${current.volumeRatio.toFixed(1)}x normal.`);
  }

  // --- Signal 3: recency (did this happen after the user's last visit?) ---
  if (!isFirstView && lastSeen.seenAt) {
    const changedAfterLastVisit = new Date(current.timestamp) > new Date(lastSeen.seenAt);
    if (changedAfterLastVisit && magnitude > 0.2) {
      reasons.push('This movement happened after your last visit.');
    }
  }

  // --- Signal 4: peer-relative divergence -----------------------------------
  if (peer && peer.confidence !== 'NONE' && typeof peer.relativeMovePercent === 'number') {
    const divergence = Math.abs(peer.relativeMovePercent);
    if (divergence > 0.8) {
      score += divergence * PEER_DIVERGENCE_WEIGHT;
      const isUnderperforming =
        Math.sign(current.dayChangePercent || 1) === Math.sign(peer.sectorMovePercent ?? 0) &&
        Math.abs(current.dayChangePercent) > Math.abs(peer.sectorMovePercent ?? 0);
      if (isUnderperforming || Math.sign(current.dayChangePercent) !== Math.sign(peer.sectorMovePercent ?? 0)) {
        score += UNDERPERFORM_BONUS;
      }
      reasons.push(peer.interpretation);
    } else if (peer.interpretation) {
      // Informational only — sector-driven moves don't add score, they
      // explain a move that's already been scored, per section 2B.
      reasons.push(peer.interpretation);
    }
  }

  // --- Group context is informational, added by the caller after ranking ---
  if (group) {
    reasons.push(`Part of a ${group.symbols.length}-stock group moving together (${group.label}).`);
  }

  const thresholds = THRESHOLDS[settings.sensitivity];
  let level = levelFromScore(score, thresholds);

  // Freshness caveat: STALE data can still cross a threshold, but we cap the
  // top band and are explicit that the read is not current (section 12/49).
  if (current.freshness === 'STALE') {
    reasons.unshift(`Data is stale — last available ${formatSince(current.timestamp)}. Treat this as indicative, not current.`);
    if (level === 'NEEDS_ATTENTION') level = 'MEANINGFUL_CHANGE';
    score *= 0.85;
  } else if (current.freshness === 'DELAYED') {
    reasons.unshift(`Data is delayed — updated ${formatSince(current.timestamp)}.`);
  }

  if (reasons.length === 0) {
    reasons.push('No significant movement, volume, or peer divergence detected.');
  }

  return {
    symbol: current.symbol,
    level,
    changed: level !== 'STABLE',
    reasons,
    score: Math.round(score * 100) / 100,
    sinceLastChecked,
    peerContext: peer,
    groupContext: group,
    freshness: current.freshness,
    isFirstView,
  };
}

function computeSinceLastChecked(current: PriceSnapshot, lastSeen: LastSeenState) {
  if (lastSeen.price !== null && lastSeen.price > 0) {
    const changePercent = ((current.price - lastSeen.price) / lastSeen.price) * 100;
    return {
      changePercent,
      priorPrice: lastSeen.price,
      currentPrice: current.price,
      basis: 'LAST_SEEN' as const,
    };
  }
  // First-time viewer: use today's observed change vs previous close instead
  // of inventing a "since last checked" figure.
  const impliedPriorPrice = current.dayChangePercent !== -100
    ? current.price / (1 + current.dayChangePercent / 100)
    : current.price;
  return {
    changePercent: current.dayChangePercent,
    priorPrice: Math.round(impliedPriorPrice * 100) / 100,
    currentPrice: current.price,
    basis: 'DAY_OPEN' as const,
  };
}

function levelFromScore(score: number, t: SensitivityThresholds): AttentionLevel {
  if (score >= t.attention) return 'NEEDS_ATTENTION';
  if (score >= t.meaningful) return 'MEANINGFUL_CHANGE';
  if (score >= t.watch) return 'WORTH_WATCHING';
  return 'STABLE';
}

function formatPct(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function formatSince(iso: string | null): string {
  if (!iso) return 'recently';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'moments ago';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function freshnessRank(f: Freshness): number {
  return { FRESH: 0, DELAYED: 1, STALE: 2, UNAVAILABLE: 3 }[f];
}
