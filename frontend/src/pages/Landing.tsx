import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, TrendingUp, Search, Bell, Settings } from 'lucide-react'
import { stocks, marketIndices, watchlistStocks } from '../data/demo-data'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function Landing() {
  const navigate = useNavigate()
  const { continueAsGuest, authStatus } = useAuth()
  const [currentTickerIndex, setCurrentTickerIndex] = useState(0)
  const [showBetaAlert, setShowBetaAlert] = useState(true)

  // Rotate ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTickerIndex((prev) => (prev + 1) % marketIndices.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleGetStarted = () => {
    if (authStatus === 'authenticated') {
      navigate('/app/watchlist')
    } else {
      navigate('/signup')
    }
  }

  const generateChartData = () => {
    let price = 160
    return Array.from({ length: 50 }, (_, i) => ({
      time: i,
      price: (price = price * (1 + (Math.random() - 0.5) * 0.02)),
    }))
  }

  const chartData = generateChartData()
  const currentStock = stocks.NVDA

  return (
    <div className="min-h-screen bg-black text-text-primary">
      {/* Header */}
      <header className="border-b border-surface-200 sticky top-0 z-50 backdrop-blur-xl bg-black/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-accent tracking-wider">MARKETPULSE</div>
            <nav className="hidden md:flex gap-8 text-sm">
              <button className="text-text-secondary hover:text-text-primary transition">
                Search Stocks
              </button>
              <button className="text-text-secondary hover:text-text-primary transition">
                Watchlist
              </button>
              <button className="text-text-secondary hover:text-text-primary transition">
                Market
              </button>
              <button className="text-text-secondary hover:text-text-primary transition">
                Analysis
              </button>
            </nav>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/login')}
                className="button-ghost text-sm"
              >
                SIGN IN
              </button>
              <button onClick={handleGetStarted} className="button-primary text-sm">
                GET STARTED
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Market Ticker */}
      <div className="bg-surface-50 border-b border-surface-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="flex gap-8 px-4 py-3 text-sm whitespace-nowrap overflow-x-auto scrollbar-hide">
            {[...marketIndices, ...marketIndices].map((index, i) => (
              <div key={i} className="ticker-item">
                <span className="font-semibold">{index.symbol}</span>
                <span className={index.changePercent >= 0 ? 'text-positive' : 'text-negative'}>
                  {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
                SEE THE <span className="text-accent">MARKET</span>
                <br />
                IN MOTION.
              </h1>
              <p className="text-text-secondary text-lg mb-8 max-w-md">
                Track markets, discover opportunities and understand why stocks move — all in one
                intelligent financial workspace.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGetStarted}
                  className="button-primary flex items-center justify-center gap-2"
                >
                  EXPLORE MARKETPULSE
                  <ArrowRight size={20} />
                </button>
                <button
                  onClick={() => continueAsGuest()}
                  className="button-secondary"
                >
                  CONTINUE AS GUEST
                </button>
              </div>
            </div>

            {/* Right: Hero Chart */}
            <div className="card">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">${currentStock.price.toFixed(2)}</h2>
                <p className="text-text-secondary mb-2">{currentStock.name}</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold ${
                      currentStock.changePercent >= 0 ? 'text-positive' : 'text-negative'
                    }`}
                  >
                    {currentStock.changePercent >= 0 ? '+' : ''}
                    {currentStock.changePercent.toFixed(2)}%
                  </span>
                  <span className="text-text-secondary text-sm">
                    {currentStock.changePercent >= 0 ? '+' : ''}${currentStock.change.toFixed(2)}
                  </span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5A1F" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF5A1F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#8A8A8A" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#8A8A8A" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111111',
                      border: '1px solid #FF5A1F',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#FF5A1F"
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Market at a Glance */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-surface-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12">MARKET AT A GLANCE</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {marketIndices.map((index) => (
              <div key={index.symbol} className="card">
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
        </div>
      </section>

      {/* Watchlist Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-surface-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-3">YOUR MARKET.</h2>
          <p className="text-text-secondary mb-12">YOUR SIGNAL.</p>

          <div className="space-y-1">
            {watchlistStocks.slice(0, 5).map((stock) => (
              <div
                key={stock.symbol}
                className="metric-row"
                onClick={() => navigate(`/app/stock/${stock.symbol}`)}
              >
                <div className="flex-1 grid grid-cols-5 gap-4">
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
                  <div className="flex justify-end">
                    <TrendingUp
                      size={18}
                      className={stock.changePercent >= 0 ? 'text-positive' : 'text-negative'}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-surface-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-black mb-8">
            THE MARKET <br />
            DOESN'T WAIT.
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            MAKE SENSE OF IT WHILE IT MOVES.
          </p>
          <button
            onClick={handleGetStarted}
            className="button-primary text-lg px-8 py-4 inline-flex items-center gap-2"
          >
            ENTER MARKETPULSE
            <ArrowRight size={24} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center text-text-secondary text-sm">
          <p>© 2026 MarketPulse. Built for the Groww Code Hackathon.</p>
        </div>
      </footer>
    </div>
  )
}
