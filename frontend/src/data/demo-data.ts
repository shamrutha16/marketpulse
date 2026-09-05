import type { Stock, MarketIndex, ChartDataPoint, AIInsight, Alert } from '../types'

// Generate sparkline data
function generateSparkline(basePrice: number, days: number = 30): number[] {
  const data: number[] = []
  let price = basePrice
  for (let i = 0; i < days; i++) {
    price = price * (1 + (Math.random() - 0.5) * 0.02)
    data.push(Number(price.toFixed(2)))
  }
  return data
}

// Generate chart data for 1D view (390 minutes of trading)
function generateDayChartData(basePrice: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = []
  const now = Date.now()
  const startOfDay = now - 390 * 60 * 1000 // 390 minutes of trading
  let price = basePrice - Math.random() * 5
  
  for (let i = 0; i < 390; i += 15) { // 15-minute intervals
    price = price * (1 + (Math.random() - 0.5) * 0.001)
    const timestamp = startOfDay + i * 60 * 1000
    data.push({
      timestamp,
      date: new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      price: Number(price.toFixed(2)),
      volume: Math.floor(Math.random() * 100000000),
    })
  }
  return data
}

export const stocks: Record<string, Stock> = {
  
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 237.18,
    change: 4.22,
    changePercent: 1.82,
    volume: 38921000,
    marketCap: '$3.68T',
    pe: 32.4,
    eps: 7.32,
    revenue: '$383.3B',
    profitMargin: 26.1,
    roe: 82.4,
    debtEquity: 1.85,
    high52w: 240.65,
    low52w: 167.29,
    dayHigh: 238.42,
    dayLow: 235.88,
    previousClose: 232.96,
    sector: 'Technology',
    description: 'Apple Inc. is a technology company that designs, manufactures, and markets smartphones, computers, and software.',
    sparkline: generateSparkline(237.18),
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 499.67,
    change: 10.24,
    changePercent: 2.04,
    volume: 18421000,
    marketCap: '$3.73T',
    pe: 42.1,
    eps: 11.85,
    revenue: '$198.3B',
    profitMargin: 35.2,
    roe: 54.2,
    debtEquity: 0.72,
    high52w: 520.08,
    low52w: 308.56,
    dayHigh: 503.24,
    dayLow: 497.12,
    previousClose: 489.43,
    sector: 'Technology',
    description: 'Microsoft develops software, cloud computing services, and gaming products.',
    sparkline: generateSparkline(499.67),
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 348.22,
    change: -2.84,
    changePercent: -0.81,
    volume: 125634200,
    marketCap: '$1.10T',
    pe: 78.3,
    eps: 4.45,
    revenue: '$81.5B',
    profitMargin: 8.4,
    roe: 22.1,
    debtEquity: 0.18,
    high52w: 414.52,
    low52w: 152.37,
    dayHigh: 352.84,
    dayLow: 344.21,
    previousClose: 351.06,
    sector: 'Automotive',
    description: 'Tesla manufactures electric vehicles and energy storage products.',
    sparkline: generateSparkline(348.22),
  },
  GOOGL: {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 210.45,
    change: 3.12,
    changePercent: 1.50,
    volume: 24830100,
    marketCap: '$1.38T',
    pe: 26.8,
    eps: 7.86,
    revenue: '$307.4B',
    profitMargin: 21.5,
    roe: 18.7,
    debtEquity: 0.08,
    high52w: 216.84,
    low52w: 139.83,
    dayHigh: 211.92,
    dayLow: 208.21,
    previousClose: 207.33,
    sector: 'Technology',
    description: 'Alphabet is a holding company whose subsidiaries include Google, YouTube, and other tech companies.',
    sparkline: generateSparkline(210.45),
  },
  AMZN: {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 198.75,
    change: 5.43,
    changePercent: 2.80,
    volume: 42104300,
    marketCap: '$2.06T',
    pe: 64.2,
    eps: 3.09,
    revenue: '$575.2B',
    profitMargin: 5.2,
    roe: 21.4,
    debtEquity: 0.35,
    high52w: 204.21,
    low52w: 130.61,
    dayHigh: 200.12,
    dayLow: 196.88,
    previousClose: 193.32,
    sector: 'Consumer Cyclical',
    description: 'Amazon is an e-commerce and cloud computing company.',
    sparkline: generateSparkline(198.75),
  },
  META: {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    price: 598.42,
    change: 12.87,
    changePercent: 2.19,
    volume: 28934100,
    marketCap: '$1.85T',
    pe: 44.3,
    eps: 13.50,
    revenue: '$134.9B',
    profitMargin: 33.2,
    roe: 42.1,
    debtEquity: 0.18,
    high52w: 645.23,
    low52w: 252.15,
    dayHigh: 603.18,
    dayLow: 595.21,
    previousClose: 585.55,
    sector: 'Technology',
    description: 'Meta develops social media and virtual reality platforms.',
    sparkline: generateSparkline(598.42),
  },
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 176.42,
    change: 5.48,
    changePercent: 3.21,
    volume: 42305600,
    marketCap: '$4.32T',
    pe: 68.5,
    eps: 2.57,
    revenue: '$60.9B',
    profitMargin: 45.2,
    roe: 112.3,
    debtEquity: 0.25,
    high52w: 195.82,
    low52w: 78.31,
    dayHigh: 177.85,
    dayLow: 174.22,
    previousClose: 170.94,
    sector: 'Technology',
    description: 'NVIDIA designs and manufactures graphics processing units (GPUs) and system-on-chip units.',
    sparkline: generateSparkline(176.42),
  },
}

export const marketIndices: MarketIndex[] = [
  {
    symbol: '^GSPC',
    name: 'S&P 500',
    value: 4783.45,
    change: 35.21,
    changePercent: 0.74,
  },
  {
    symbol: '^IXIC',
    name: 'NASDAQ',
    value: 15093.28,
    change: 168.64,
    changePercent: 1.12,
  },
  {
    symbol: '^DJI',
    name: 'DOW',
    value: 37821.33,
    change: 117.02,
    changePercent: 0.31,
  },
  {
    symbol: '^VIX',
    name: 'VIX',
    value: 14.52,
    change: -0.34,
    changePercent: -2.29,
  },
]

export const watchlistStocks: Stock[] = [
  stocks.NVDA,
  stocks.AAPL,
  stocks.TSLA,
  stocks.MSFT,
  stocks.GOOGL,
  stocks.AMZN,
  stocks.META,
]

export const aiInsights: Record<string, AIInsight> = {
  NVDA: {
    symbol: 'NVDA',
    sentiment: 'bullish',
    reasoning:
      'NVDA is up 3.21% today, supported by stronger sector momentum and elevated trading volume. AI adoption trends continue to drive demand for GPU acceleration.',
    momentum: 78,
    volatility: 45,
    risk: 32,
  },
  AAPL: {
    symbol: 'AAPL',
    sentiment: 'neutral',
    reasoning: 'Modest gains as investors await new product announcements. Mixed analyst sentiment on valuation at current levels.',
    momentum: 52,
    volatility: 38,
    risk: 28,
  },
  TSLA: {
    symbol: 'TSLA',
    sentiment: 'bearish',
    reasoning: 'Slight decline amid sector rotation and profit-taking after recent run. Macro headwinds weighing on EV sentiment.',
    momentum: 35,
    volatility: 62,
    risk: 58,
  },
}

export const dayChartData: ChartDataPoint[] = generateDayChartData(176.42)

export const alerts: Alert[] = [
  {
    id: '1',
    symbol: 'NVDA',
    type: 'price_target',
    value: 175,
    createdAt: new Date(Date.now() - 3600000),
    triggeredAt: new Date(Date.now() - 2400000),
  },
  {
    id: '2',
    symbol: 'AAPL',
    type: 'volume',
    value: 40000000,
    createdAt: new Date(Date.now() - 7200000),
    triggeredAt: new Date(Date.now() - 5400000),
  },
  {
    id: '3',
    symbol: 'TSLA',
    type: 'percentage_change',
    value: -1,
    createdAt: new Date(Date.now() - 10800000),
    triggeredAt: new Date(Date.now() - 8100000),
  },
]

export const trendingSearches = [
  { symbol: 'NVDA', name: 'NVIDIA', change: 3.21, changePercent: 3.21 },
  { symbol: 'AAPL', name: 'Apple', change: 1.82, changePercent: 1.82 },
  { symbol: 'MSFT', name: 'Microsoft', change: 2.04, changePercent: 2.04 },
  { symbol: 'TSLA', name: 'Tesla', change: -0.81, changePercent: -0.81 },
  { symbol: 'GOOGL', name: 'Alphabet', change: 1.50, changePercent: 1.50 },
]
