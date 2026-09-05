import { describe, expect, it } from 'vitest';
import { buildInsights, rankInsights } from './attentionRanking';
import type { ChangeVerdict, GroupContext } from './types';

function verdict(symbol: string, score: number, changed = true): ChangeVerdict {
  return {
    symbol,
    level: changed ? 'MEANINGFUL_CHANGE' : 'STABLE',
    changed,
    reasons: ['test'],
    score,
    sinceLastChecked: null,
    freshness: 'FRESH',
    isFirstView: false,
  };
}

describe('buildInsights + rankInsights', () => {
  it('collapses grouped symbols into a single insight', () => {
    const verdicts = [verdict('TCS', 3), verdict('INFY', 3.2), verdict('WIPRO', 2.9)];
    const group: GroupContext = {
      groupId: 'IT-up',
      sector: 'IT',
      label: 'Your IT stocks moved together',
      symbols: ['TCS', 'INFY', 'WIPRO'],
      averageMovePercent: 2.5,
    };
    const insights = buildInsights(verdicts, [group]);
    expect(insights).toHaveLength(1);
    expect(insights[0].kind).toBe('GROUP');
    expect(insights[0].members).toHaveLength(3);
  });

  it('leaves ungrouped changed symbols as individual insights and drops unchanged ones', () => {
    const verdicts = [verdict('RELIANCE', 8), verdict('HDFC', 0, false)];
    const insights = buildInsights(verdicts, []);
    expect(insights.map((i) => i.id)).toEqual(['RELIANCE']);
  });

  it('respects the attention budget, charging a group as one slot', () => {
    const verdicts = [
      verdict('TCS', 3),
      verdict('INFY', 3.2),
      verdict('WIPRO', 2.9),
      verdict('RELIANCE', 8),
      verdict('HDFC', 5),
    ];
    const group: GroupContext = {
      groupId: 'IT-up',
      sector: 'IT',
      label: 'Your IT stocks moved together',
      symbols: ['TCS', 'INFY', 'WIPRO'],
      averageMovePercent: 2.5,
    };
    const insights = buildInsights(verdicts, [group]);
    // 3 candidates total: the group, RELIANCE, HDFC
    const ranked = rankInsights(insights, { sensitivity: 'BALANCED', attentionBudget: 2 });
    expect(ranked.totalCandidates).toBe(3);
    expect(ranked.surfaced).toHaveLength(2);
    expect(ranked.surfaced[0].id).toBe('RELIANCE'); // score 8, highest
    expect(ranked.suppressed).toHaveLength(1);
  });

  it('"everything" budget (-1) surfaces all candidates', () => {
    const insights = buildInsights([verdict('A', 1), verdict('B', 2), verdict('C', 3)], []);
    const ranked = rankInsights(insights, { sensitivity: 'BALANCED', attentionBudget: -1 });
    expect(ranked.surfaced).toHaveLength(3);
    expect(ranked.suppressed).toHaveLength(0);
  });

  it('ranking is deterministic and stable across repeated calls', () => {
    const insights = buildInsights([verdict('A', 5), verdict('B', 5), verdict('C', 9)], []);
    const r1 = rankInsights(insights, { sensitivity: 'BALANCED', attentionBudget: 3 });
    const r2 = rankInsights(insights, { sensitivity: 'BALANCED', attentionBudget: 3 });
    expect(r1.surfaced.map((i) => i.id)).toEqual(r2.surfaced.map((i) => i.id));
    expect(r1.surfaced[0].id).toBe('C');
  });
});
