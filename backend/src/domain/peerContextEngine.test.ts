import { describe, expect, it } from 'vitest';
import { computePeerContext } from './peerContextEngine';

describe('computePeerContext', () => {
  it('reports insufficient data with fewer than 2 peers', () => {
    const ctx = computePeerContext(
      { symbol: 'RELIANCE', dayChangePercent: -3.2, sector: 'Energy' },
      [{ symbol: 'ONGC', dayChangePercent: -3.0, sector: 'Energy' }],
    );
    expect(ctx.confidence).toBe('NONE');
    expect(ctx.interpretation).toMatch(/insufficient/i);
  });

  it('reports insufficient data when the stock has no sector', () => {
    const ctx = computePeerContext({ symbol: 'X', dayChangePercent: 1 }, []);
    expect(ctx.confidence).toBe('NONE');
  });

  it('calls a move sector-driven when it tracks its peers closely', () => {
    const ctx = computePeerContext(
      { symbol: 'RELIANCE', dayChangePercent: -3.2, sector: 'Energy' },
      [
        { symbol: 'ONGC', dayChangePercent: -3.0, sector: 'Energy' },
        { symbol: 'IOC', dayChangePercent: -2.8, sector: 'Energy' },
        { symbol: 'BPCL', dayChangePercent: -3.1, sector: 'Energy' },
      ],
    );
    expect(ctx.interpretation).toMatch(/sector-driven/i);
    expect(ctx.confidence).toBe('HIGH');
  });

  it('flags underperformance when the stock moves much more than its sector', () => {
    const ctx = computePeerContext(
      { symbol: 'INFY', dayChangePercent: -3.1, sector: 'IT' },
      [
        { symbol: 'TCS', dayChangePercent: -0.3, sector: 'IT' },
        { symbol: 'WIPRO', dayChangePercent: -0.5, sector: 'IT' },
      ],
    );
    expect(ctx.interpretation).toMatch(/underperformed/i);
  });

  it('flags outperformance when positive and above sector', () => {
    const ctx = computePeerContext(
      { symbol: 'TCS', dayChangePercent: 4.0, sector: 'IT' },
      [
        { symbol: 'INFY', dayChangePercent: 0.5, sector: 'IT' },
        { symbol: 'WIPRO', dayChangePercent: 0.4, sector: 'IT' },
      ],
    );
    expect(ctx.interpretation).toMatch(/outperformed/i);
  });

  it('flags moving against the sector when signs differ', () => {
    const ctx = computePeerContext(
      { symbol: 'WIPRO', dayChangePercent: 2.0, sector: 'IT' },
      [
        { symbol: 'TCS', dayChangePercent: -1.5, sector: 'IT' },
        { symbol: 'INFY', dayChangePercent: -1.8, sector: 'IT' },
      ],
    );
    expect(ctx.interpretation).toMatch(/against its sector/i);
  });
});
