// Market Pulse — peer/sector context engine.
//
// A price move means something different depending on what the rest of the
// sector is doing (section 2B). This module is intentionally tiny and
// isolated: given one stock's move and its peers' moves, it produces a
// single deterministic interpretation. It never invents a sector average
// from insufficient data — with fewer than 2 peers it explicitly says so
// (confidence: 'NONE') rather than guessing.

import type { PeerContext } from './types';

export interface PeerInput {
  symbol: string;
  dayChangePercent: number;
  sector?: string;
}

const SECTOR_DRIVEN_BAND = 1.0; // |relative move| below this = "broadly sector-driven"

export function computePeerContext(target: PeerInput, sectorPeers: PeerInput[]): PeerContext {
  const peers = sectorPeers.filter((p) => p.symbol !== target.symbol);

  if (!target.sector || peers.length < 2) {
    return { interpretation: 'Insufficient peer data.', confidence: 'NONE' };
  }

  const sectorMovePercent = average(peers.map((p) => p.dayChangePercent));
  const relativeMovePercent = target.dayChangePercent - sectorMovePercent;
  const confidence = peers.length >= 3 ? 'HIGH' : 'LOW';

  let interpretation: string;
  if (Math.abs(relativeMovePercent) < SECTOR_DRIVEN_BAND) {
    interpretation = 'Movement appears broadly sector-driven.';
  } else if (Math.sign(target.dayChangePercent) !== Math.sign(sectorMovePercent) && Math.abs(sectorMovePercent) > 0.2) {
    interpretation = `Moving against its sector (sector average ${formatPct(sectorMovePercent)}).`;
  } else if (Math.abs(target.dayChangePercent) > Math.abs(sectorMovePercent)) {
    interpretation =
      target.dayChangePercent < 0
        ? `Underperformed its sector (sector average ${formatPct(sectorMovePercent)}).`
        : `Outperformed its sector (sector average ${formatPct(sectorMovePercent)}).`;
  } else {
    interpretation = `Moved less than its sector (sector average ${formatPct(sectorMovePercent)}).`;
  }

  return {
    sectorMovePercent: round(sectorMovePercent),
    relativeMovePercent: round(relativeMovePercent),
    interpretation,
    confidence,
  };
}

function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatPct(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
