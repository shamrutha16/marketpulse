#!/bin/bash

echo "🚀 MarketPulse Quick Start"
echo "========================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install --prefix backend > /dev/null 2>&1 &
npm install --prefix frontend > /dev/null 2>&1
wait

echo "✅ Dependencies installed!"
echo ""
echo "🎯 Starting MarketPulse..."
echo ""
echo "Backend will start on: http://localhost:4877"
echo "Frontend will start on: http://localhost:5173"
echo ""

# Start both servers
npm run dev:backend &
BACKEND_PID=$!

sleep 2

npm run dev:frontend &
FRONTEND_PID=$!

echo ""
echo "✨ Both servers are running!"
echo "Press Ctrl+C to stop"
echo ""

wait
