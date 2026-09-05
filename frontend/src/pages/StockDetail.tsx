import React from 'react'
import { useParams } from 'react-router-dom'
import { stocks } from '../data/demo-data'

export default function StockDetail() {
  const { symbol } = useParams()
  const stock = stocks[symbol as string] || stocks.NVDA

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-5xl font-bold mb-2">{stock.symbol}</h1>
        <p className="text-text-secondary text-lg mb-4">{stock.name}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">${stock.price.toFixed(2)}</span>
          <span
            className={`text-xl font-semibold ${
              stock.changePercent >= 0 ? 'text-positive' : 'text-negative'
            }`}
          >
            {stock.changePercent >= 0 ? '+' : ''}{stock.change.toFixed(2)} (
            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Chart */}
        <div className="card p-0 h-96 flex items-center justify-center bg-surface-100">
          <p className="text-text-secondary">Interactive chart coming soon...</p>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-6">KEY METRICS</h2>
          <div className="card">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Market Cap</span>
                <span className="font-semibold">{stock.marketCap}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">P/E Ratio</span>
                <span className="font-semibold">{stock.pe?.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">EPS</span>
                <span className="font-semibold">${stock.eps?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">52W High</span>
                <span className="font-semibold">${stock.high52w?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">52W Low</span>
                <span className="font-semibold">${stock.low52w?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
