// Canonical instrument reference list. Seeded into the `instruments` table
// (for search + sector lookups) and used by the demo provider as its
// simulation universe. In a real deployment this would sync nightly from an
// exchange instrument master instead of living in source.

export interface InstrumentDef {
  symbol: string;
  name: string;
  sector: string;
  basePrice: number;
}

export const INSTRUMENTS: InstrumentDef[] = [
  // IT
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', basePrice: 3850 },
  { symbol: 'INFY', name: 'Infosys', sector: 'IT', basePrice: 1501 },
  { symbol: 'WIPRO', name: 'Wipro', sector: 'IT', basePrice: 452 },
  { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT', basePrice: 1680 },
  { symbol: 'TECHM', name: 'Tech Mahindra', sector: 'IT', basePrice: 1590 },
  // Energy
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', basePrice: 1483 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation', sector: 'Energy', basePrice: 268 },
  { symbol: 'IOC', name: 'Indian Oil Corporation', sector: 'Energy', basePrice: 172 },
  { symbol: 'BPCL', name: 'Bharat Petroleum', sector: 'Energy', basePrice: 331 },
  // Banking
  { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', basePrice: 1712 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', basePrice: 1268 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking', basePrice: 1798 },
  { symbol: 'AXISBANK', name: 'Axis Bank', sector: 'Banking', basePrice: 1142 },
  // Auto
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', sector: 'Auto', basePrice: 12480 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Auto', basePrice: 812 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Auto', basePrice: 2860 },
  // Pharma
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma', basePrice: 1782 },
  { symbol: 'CIPLA', name: 'Cipla', sector: 'Pharma', basePrice: 1512 },
  { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories", sector: 'Pharma', basePrice: 1268 },
  // FMCG
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', basePrice: 2412 },
  { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG', basePrice: 468 },
  { symbol: 'NESTLEIND', name: 'Nestle India', sector: 'FMCG', basePrice: 2298 },
  // Power (used for the volume-spike-only scenario)
  { symbol: 'ADANIPOWER', name: 'Adani Power', sector: 'Power', basePrice: 612 },
  { symbol: 'NTPC', name: 'NTPC Limited', sector: 'Power', basePrice: 372 },
];

export const INSTRUMENT_BY_SYMBOL = new Map(INSTRUMENTS.map((i) => [i.symbol, i]));
