import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthRequired from './AuthRequired'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authStatus } = useAuth()

  if (authStatus === 'unauthenticated') {
    return <AuthRequired />
  }

  if (authStatus === 'guest') {
    return <AuthRequired />
  }

  return <>{children}</>
}
