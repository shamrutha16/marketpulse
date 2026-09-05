import React from 'react'
import { watchlistStocks } from '../data/demo-data'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function Watchlist() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">YOUR WATCHLIST</h1>

      <div className="space-y-1">
        {watchlistStocks.map((stock) => (
          <div
            key={stock.symbol}
            className="metric-row cursor-pointer hover:bg-surface-100 transition-colors"
          >
            <div className="flex-1 grid grid-cols-6 gap-4">
              <div>
                <p className="font-semibold">{stock.symbol}</p>
                <p className="text-sm text-text-secondary">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${stock.price.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className={stock.changePercent >= 0 ? 'text-positive' : 'text-negative'}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`font-semibold ${
                    stock.changePercent >= 0 ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </p>
              </div>
              <div className="w-20">
                <div className="flex gap-1 h-8">
                  {stock.sparkline?.slice(-10).map((price, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-accent/20"
                      style={{
                        height: `${(price / Math.max(...(stock.sparkline || []))) * 100}%`,
                        margin: 'auto 0',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                {stock.changePercent >= 0 ? (
                  <TrendingUp size={18} className="text-positive" />
                ) : (
                  <TrendingDown size={18} className="text-negative" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
