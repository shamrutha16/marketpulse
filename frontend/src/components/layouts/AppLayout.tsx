import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Search, Settings, Menu, X, Moon, Sun } from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void
}

export default function AppLayout({ children, theme, setTheme }: AppLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { path: '/app/watchlist', label: 'Watchlist' },
    { path: '/app/market', label: 'Market' },
    { path: '/app/analysis', label: 'Analysis' },
    { path: '/app/alerts', label: 'Alerts' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-black text-text-primary">
      {/* Header */}
      <header className="border-b border-surface-200 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              to="/app/watchlist"
              className="text-2xl font-bold text-accent tracking-wider"
            >
              MARKETPULSE
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'text-accent'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/app/search')}
                className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
              >
                <Search size={20} />
              </button>

              <div className="relative">
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
                >
                  <Settings size={20} />
                </button>

                {settingsOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface-100 border border-surface-200 rounded-lg shadow-xl z-50">
                    <div className="p-4 space-y-4">
                      <div>
                        <p className="text-sm text-text-secondary mb-2">Theme</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setTheme('dark')
                              localStorage.setItem('theme', 'dark')
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded ${
                              theme === 'dark'
                                ? 'bg-accent text-black'
                                : 'bg-surface-50 hover:bg-surface-100'
                            }`}
                          >
                            <Moon size={16} /> Dark
                          </button>
                          <button
                            onClick={() => {
                              setTheme('light')
                              localStorage.setItem('theme', 'light')
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded ${
                              theme === 'light'
                                ? 'bg-accent text-black'
                                : 'bg-surface-50 hover:bg-surface-100'
                            }`}
                          >
                            <Sun size={16} /> Light
                          </button>
                        </div>
                      </div>
                      <div className="border-t border-surface-200 pt-4">
                        <Link
                          to="/app/settings"
                          className="block text-sm hover:text-accent mb-2"
                        >
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            logout()
                            navigate('/')
                          }}
                          className="block text-sm text-negative hover:underline w-full text-left"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-surface-100 rounded-lg"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 space-y-2 pb-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded transition-colors ${
                    isActive(link.path)
                      ? 'bg-accent text-black'
                      : 'text-text-secondary hover:bg-surface-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-surface-50 text-text-secondary text-sm text-center py-4">
        <p>© 2026 MarketPulse. Real-time market data powered by Groww.</p>
      </footer>
    </div>
  )
}
