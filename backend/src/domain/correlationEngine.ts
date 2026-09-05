// Market Pulse — correlated-movement (grouping) engine.
//
// Deliberately NOT machine learning (section 19): sector-mates moving in the
// same direction, by a meaningful and similar amount, on the same check, is
// a simple and fully explainable definition of "moving together." A
// clustering model would add opacity without adding real signal at this
// scale (a handful of watchlist items) — see README "Why deterministic
// rules instead of AI?".
//
// ALGORITHM
// ---------
// 1. Bucket watchlist snapshots by sector.
// 2. Within a sector, keep only symbols whose move exceeds `MIN_MOVE` and
//    shares the same sign (all up, or all down) as at least MIN_GROUP_SIZE-1
//    other members.
// 3. Require the group to be *cohesive*: the spread (max-min) of member
//    moves must stay under `MAX_SPREAD`, otherwise "IT moved -8% to +1%" is
//    not one story — it's several.
// 4. Groups smaller than MIN_GROUP_SIZE are dropped: two stocks moving
//    together is (Correlation? Coincidence? Not different enough from
//    individual coverage.) — the product deliberately reserves "your sector
//    is moving together" for genuinely broad moves.

export interface CorrelationInput {
  symbol: string;
  dayChangePercent: number;
  sector?: string;
}

export interface CorrelatedGroup {
  groupId: string;
  label: string;
  sector: string;
  symbols: string[];
  averageMovePercent: number;
}

const MIN_MOVE = 1.2; // % — below this a move doesn't count toward a group
const MAX_SPREAD = 2.5; // % — max-min move allowed within one group
const MIN_GROUP_SIZE = 3;

export function findCorrelatedGroups(snapshots: CorrelationInput[]): CorrelatedGroup[] {
  const bySector = new Map<string, CorrelationInput[]>();
  for (const s of snapshots) {
    if (!s.sector) continue;
    if (!bySector.has(s.sector)) bySector.set(s.sector, []);
    bySector.get(s.sector)!.push(s);
  }

  const groups: CorrelatedGroup[] = [];

  for (const [sector, members] of bySector.entries()) {
    const movers = members.filter((m) => Math.abs(m.dayChangePercent) >= MIN_MOVE);
    const up = movers.filter((m) => m.dayChangePercent > 0);
    const down = movers.filter((m) => m.dayChangePercent < 0);

    for (const directional of [up, down]) {
      if (directional.length < MIN_GROUP_SIZE) continue;
      const moves = directional.map((m) => m.dayChangePercent);
      const spread = Math.max(...moves) - Math.min(...moves);
      if (spread > MAX_SPREAD) continue;

      const avg = moves.reduce((a, b) => a + b, 0) / moves.length;
      const direction = avg > 0 ? 'up' : 'down';
      groups.push({
        groupId: `${sector}-${direction}`,
        label: `Your ${sector} stocks moved together`,
        sector,
        symbols: directional.map((m) => m.symbol),
        averageMovePercent: Math.round(avg * 100) / 100,
      });
    }
  }

  return groups;
}
