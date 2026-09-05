import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function AuthRequired() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-text-primary mb-4">SIGN IN TO CONTINUE</h1>
        <p className="text-text-secondary mb-8">
          Access your personalized MarketPulse workspace.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="button-primary w-full flex items-center justify-center gap-2"
          >
            SIGN IN
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="button-secondary w-full"
          >
            CREATE ACCOUNT
          </button>
          <button
            onClick={() => navigate('/')}
            className="button-ghost w-full"
          >
            CONTINUE AS GUEST
          </button>
        </div>
      </div>
    </div>
  )
}
