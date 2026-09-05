import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Watchlist from './pages/Watchlist'
import Market from './pages/Market'
import StockDetail from './pages/StockDetail'
import Search from './pages/Search'
import Analysis from './pages/Analysis'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import OTPVerification from './pages/auth/OTPVerification'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layouts/AppLayout'

function AppContent() {
  const { authStatus } = useAuth()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  return (
    <div className={theme === 'light' ? 'light' : 'dark'}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<OTPVerification />} />

        {/* Protected routes */}
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <AppLayout theme={theme} setTheme={setTheme}>
                <Routes>
                  <Route path="watchlist" element={<Watchlist />} />
                  <Route path="market" element={<Market />} />
                  <Route path="stock/:symbol" element={<StockDetail />} />
                  <Route path="search" element={<Search />} />
                  <Route path="analysis" element={<Analysis />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="watchlist" replace />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
