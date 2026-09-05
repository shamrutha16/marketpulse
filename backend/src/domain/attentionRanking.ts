// Market Pulse — attention ranking engine.
//
// Takes every candidate insight (already scored by the change engine and
// grouped by the correlation engine) and decides which ones actually get
// shown, honoring the user's attention budget (section 2D). Ranking is a
// stable sort by score, descending — nothing probabilistic, nothing
// personalized beyond the two dials the user explicitly controls
// (sensitivity feeds the change engine's thresholds; attentionBudget feeds
// the cut line here). A group counts as ONE slot against the budget even
// though it represents several symbols, because collapsing them into one
// story is the point (section 2C) — charging the user's budget per member
// would defeat it.

import type { AttentionSettings, ChangeVerdict, GroupContext, Insight, RankedInsights } from './types';

export function buildInsights(verdicts: ChangeVerdict[], groups: GroupContext[]): Insight[] {
  const grouped = new Set(groups.flatMap((g) => g.symbols));
  const insights: Insight[] = [];

  for (const group of groups) {
    const members = verdicts.filter((v) => group.symbols.includes(v.symbol));
    if (members.length === 0) continue;
    // A group's own "score" is the average of its members' scores, so it
    // competes fairly against ungrouped insights of similar magnitude.
    const score = members.reduce((a, m) => a + m.score, 0) / members.length;
    const best = members.reduce((a, b) => (b.score > a.score ? b : a));
    insights.push({
      id: `group:${group.groupId}`,
      kind: 'GROUP',
      verdict: { ...best, score, groupContext: group },
      members,
    });
  }

  for (const v of verdicts) {
    if (grouped.has(v.symbol)) continue; // already represented via its group
    if (!v.changed) continue;
    insights.push({ id: v.symbol, kind: 'SINGLE', verdict: v });
  }

  return insights;
}

export function rankInsights(insights: Insight[], settings: AttentionSettings): RankedInsights {
  const sorted = [...insights].sort((a, b) => b.verdict.score - a.verdict.score);
  const budget = settings.attentionBudget;
  const unlimited = budget < 0;

  const surfaced = unlimited ? sorted : sorted.slice(0, budget);
  const suppressed = unlimited ? [] : sorted.slice(budget);

  return {
    surfaced,
    suppressed,
    totalCandidates: insights.length,
    budget: unlimited ? insights.length : budget,
  };
}
