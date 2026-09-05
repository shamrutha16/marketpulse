import React from 'react'
import { marketIndices } from '../data/demo-data'

export default function Market() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">THE MARKET</h1>

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {marketIndices.map((index) => (
          <div key={index.symbol} className="card cursor-pointer hover:bg-surface-100">
            <p className="text-text-secondary text-sm mb-2">{index.name}</p>
            <p className="text-3xl font-bold mb-2">{index.value.toFixed(2)}</p>
            <p
              className={`text-sm font-semibold ${
                index.changePercent >= 0 ? 'text-positive' : 'text-negative'
              }`}
            >
              {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>

      <div className="card p-0 h-96 flex items-center justify-center bg-surface-100">
        <p className="text-text-secondary">Interactive market chart coming soon...</p>
      </div>
    </div>
  )
}
