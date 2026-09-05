import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ArrowRight } from 'lucide-react'

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await signup(name, email, password)
      navigate('/app/watchlist')
    } catch (error) {
      console.error('Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-text-primary flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">CREATE ACCOUNT</h1>
          <p className="text-text-secondary">Join MarketPulse today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary block mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-surface-100 border border-surface-200 rounded-lg focus:outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-surface-100 border border-surface-200 rounded-lg focus:outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-surface-100 border border-surface-200 rounded-lg focus:outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary block mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-surface-100 border border-surface-200 rounded-lg focus:outline-none focus:border-accent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button-primary w-full flex items-center justify-center gap-2 mt-6"
          >
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-text-secondary">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-accent hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
