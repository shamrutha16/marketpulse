export interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: string
  pe?: number
  eps?: number
  revenue?: string
  profitMargin?: number
  roe?: number
  debtEquity?: number
  high52w?: number
  low52w?: number
  dayHigh?: number
  dayLow?: number
  previousClose?: number
  sector?: string
  description?: string
  sparkline?: number[]
}

export interface ChartDataPoint {
  timestamp: number
  date: string
  price: number
  volume?: number
}

export interface MarketIndex {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
  high?: number
  low?: number
}

export interface Watchlist {
  id: string
  name: string
  stocks: Stock[]
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  watchlists: Watchlist[]
}

export interface Alert {
  id: string
  symbol: string
  type: 'price_target' | 'volume' | 'percentage_change' | 'moving_average'
  value: number
  createdAt: Date
  triggeredAt?: Date
}

export interface AIInsight {
  symbol: string
  sentiment: 'bullish' | 'neutral' | 'bearish'
  reasoning: string
  momentum: number
  volatility: number
  risk: number
}

export type AuthStatus = 'unauthenticated' | 'guest' | 'authenticated'
