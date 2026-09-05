import { describe, expect, it } from 'vitest';
import { findCorrelatedGroups } from './correlationEngine';

describe('findCorrelatedGroups', () => {
  it('groups 3+ same-sector stocks moving in the same direction by a similar amount', () => {
    const groups = findCorrelatedGroups([
      { symbol: 'TCS', dayChangePercent: 2.4, sector: 'IT' },
      { symbol: 'INFY', dayChangePercent: 2.7, sector: 'IT' },
      { symbol: 'WIPRO', dayChangePercent: 2.3, sector: 'IT' },
      { symbol: 'HCLTECH', dayChangePercent: 2.6, sector: 'IT' },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].symbols.sort()).toEqual(['HCLTECH', 'INFY', 'TCS', 'WIPRO']);
    expect(groups[0].averageMovePercent).toBeCloseTo(2.5, 1);
  });

  it('does not group fewer than 3 movers', () => {
    const groups = findCorrelatedGroups([
      { symbol: 'TCS', dayChangePercent: 2.4, sector: 'IT' },
      { symbol: 'INFY', dayChangePercent: 2.7, sector: 'IT' },
    ]);
    expect(groups).toHaveLength(0);
  });

  it('does not group stocks moving in opposite directions', () => {
    const groups = findCorrelatedGroups([
      { symbol: 'TCS', dayChangePercent: 2.4, sector: 'IT' },
      { symbol: 'INFY', dayChangePercent: -2.7, sector: 'IT' },
      { symbol: 'WIPRO', dayChangePercent: 2.3, sector: 'IT' },
    ]);
    expect(groups).toHaveLength(0);
  });

  it('does not group a wide, incoherent spread even if directionally aligned', () => {
    const groups = findCorrelatedGroups([
      { symbol: 'TCS', dayChangePercent: 1.3, sector: 'IT' },
      { symbol: 'INFY', dayChangePercent: 6.0, sector: 'IT' },
      { symbol: 'WIPRO', dayChangePercent: 1.5, sector: 'IT' },
    ]);
    expect(groups).toHaveLength(0);
  });

  it('ignores stocks with no sector', () => {
    const groups = findCorrelatedGroups([
      { symbol: 'A', dayChangePercent: 2.0 },
      { symbol: 'B', dayChangePercent: 2.1 },
      { symbol: 'C', dayChangePercent: 2.2 },
    ]);
    expect(groups).toHaveLength(0);
  });

  it('can find both an up-group and a down-group across different sectors independently', () => {
    const groups = findCorrelatedGroups([
      { symbol: 'TCS', dayChangePercent: 2.4, sector: 'IT' },
      { symbol: 'INFY', dayChangePercent: 2.7, sector: 'IT' },
      { symbol: 'WIPRO', dayChangePercent: 2.3, sector: 'IT' },
      { symbol: 'RELIANCE', dayChangePercent: -3.2, sector: 'Energy' },
      { symbol: 'ONGC', dayChangePercent: -3.0, sector: 'Energy' },
      { symbol: 'IOC', dayChangePercent: -2.8, sector: 'Energy' },
    ]);
    expect(groups).toHaveLength(2);
  });
});
