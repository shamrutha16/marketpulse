import React, { createContext, useContext, useState, useCallback } from 'react'
import type { AuthStatus, User } from '../types'

interface AuthContextType {
  authStatus: AuthStatus
  user: User | null
  showDelayedSignup: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  continueAsGuest: () => void
  logout: () => void
  hideDelayedSignup: () => void
  showDelayedSignupModal: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('unauthenticated')
  const [user, setUser] = useState<User | null>(null)
  const [showDelayedSignup, setShowDelayedSignup] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    setUser({
      id: '1',
      email,
      name: email.split('@')[0],
      watchlists: [],
    })
    setAuthStatus('authenticated')
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    setUser({
      id: '2',
      email,
      name,
      watchlists: [],
    })
    setAuthStatus('authenticated')
  }, [])

  const continueAsGuest = useCallback(() => {
    setAuthStatus('guest')
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setAuthStatus('unauthenticated')
  }, [])

  const hideDelayedSignup = useCallback(() => {
    setShowDelayedSignup(false)
  }, [])

  const showDelayedSignupModal = useCallback(() => {
    setShowDelayedSignup(true)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        authStatus,
        user,
        showDelayedSignup,
        login,
        signup,
        continueAsGuest,
        logout,
        hideDelayedSignup,
        showDelayedSignupModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
