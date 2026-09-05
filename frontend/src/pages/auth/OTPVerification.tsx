import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OTPVerification() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(300)

  return (
    <div className="min-h-screen bg-black text-text-primary flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">VERIFY YOUR PHONE</h1>
          <p className="text-text-secondary">We sent a 6-digit code to +91 XXXXX XXXXX</p>
        </div>

        <div className="space-y-6">
          <div className="flex gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const newOtp = [...otp]
                  newOtp[index] = e.target.value
                  setOtp(newOtp)
                }}
                className="w-12 h-14 bg-surface-100 border border-surface-200 rounded-lg text-center text-xl font-bold focus:outline-none focus:border-accent"
              />
            ))}
          </div>

          <button
            onClick={() => navigate('/app/watchlist')}
            className="button-primary w-full"
          >
            VERIFY CODE
          </button>

          <div className="text-center">
            <p className="text-text-secondary mb-2">
              Code expires in{' '}
              <span className="text-accent font-semibold">
                {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
              </span>
            </p>
            <button className="text-accent hover:underline">RESEND CODE</button>
          </div>

          <button
            onClick={() => setOtp(['', '', '', '', '', ''])}
            className="text-text-secondary hover:text-text-primary w-full text-sm"
          >
            ← CHANGE PHONE NUMBER
          </button>
        </div>
      </div>
    </div>
  )
}
