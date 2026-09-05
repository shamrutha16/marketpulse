// Market Pulse — core domain types.
//
// Everything in `domain/` is pure and framework-free: no Express, no
// Drizzle/pg, no provider SDKs. These types and the engines that operate on
// them could be lifted into a completely different backend (or run in the
// browser) unchanged. That boundary is deliberate — see README
// "Full architecture" — it's what makes the change/peer/correlation/ranking
// logic unit-testable without a database or a network call.

export type Freshness = 'FRESH' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';

export type Sensitivity = 'CALM' | 'BALANCED' | 'SENSITIVE';

export type AttentionLevel = 'STABLE' | 'WORTH_WATCHING' | 'MEANINGFUL_CHANGE' | 'NEEDS_ATTENTION';

/** A single point-in-time read of a symbol, normalized across providers. */
export interface PriceSnapshot {
  symbol: string;
  price: number;
  /** % change vs the previous close — an OBSERVED figure from the provider. */
  dayChangePercent: number;
  /** Today's volume divided by the trailing average. 1.0 = normal. */
  volumeRatio: number;
  dayHigh?: number;
  dayLow?: number;
  sector?: string;
  /** ISO-8601. When the provider says this reading was true. */
  timestamp: string;
  provider: string;
  freshness: Freshness;
}

/** What the user actually saw the last time they looked at this symbol. */
export interface LastSeenState {
  seenAt: string | null;
  price: number | null;
  changePercent: number | null;
}

export interface PeerContext {
  sectorMovePercent?: number;
  relativeMovePercent?: number;
  interpretation: string;
  confidence: 'HIGH' | 'LOW' | 'NONE';
}

export interface GroupContext {
  groupId: string;
  label: string;
  sector: string;
  symbols: string[];
  averageMovePercent: number;
}

/**
 * The output of the meaningful-change engine. `score` is never shown to the
 * user as a mysterious number — it exists to sort/threshold, and every
 * contribution to it is spelled out in `reasons`.
 */
export interface ChangeVerdict {
  symbol: string;
  level: AttentionLevel;
  changed: boolean;
  reasons: string[];
  score: number;
  sinceLastChecked: {
    changePercent: number;
    priorPrice: number;
    currentPrice: number;
    basis: 'LAST_SEEN' | 'DAY_OPEN'; // DAY_OPEN = first-time viewer, no prior state
  } | null;
  peerContext?: PeerContext;
  groupContext?: GroupContext;
  freshness: Freshness;
  isFirstView: boolean;
}

export interface AttentionSettings {
  sensitivity: Sensitivity;
  /** 1, 3, 5, or -1 meaning "everything". */
  attentionBudget: number;
}

/** A candidate the ranking engine may choose to surface. */
export interface Insight {
  id: string; // symbol, or `group:<groupId>` for a collapsed group
  kind: 'SINGLE' | 'GROUP';
  verdict: ChangeVerdict;
  /** For GROUP insights, the member verdicts (already computed individually). */
  members?: ChangeVerdict[];
}

export interface RankedInsights {
  surfaced: Insight[];
  suppressed: Insight[];
  totalCandidates: number;
  budget: number;
}

export interface HistoricalPoint {
  timestamp: string;
  price: number;
}

export interface MarketStatus {
  isOpen: boolean;
  session: 'PRE_OPEN' | 'OPEN' | 'CLOSED' | 'HOLIDAY';
  asOf: string;
}
