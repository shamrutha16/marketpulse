@echo off
echo 🚀 MarketPulse Quick Start
echo =========================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed. Please install Node.js from https://nodejs.org
    exit /b 1
)

echo 📦 Installing dependencies...
cd /d %~dp0
start "" cmd /k "cd backend && npm install && exit"
cd frontend && npm install

echo ✅ Dependencies installed!
echo.
echo 🎯 Starting MarketPulse...
echo.
echo Backend will start on: http://localhost:4877
echo Frontend will start on: http://localhost:5173
echo.

REM Start backend in a new window
start "MarketPulse Backend" cmd /k "cd /d %~dp0backend && npm run dev"

REM Give backend time to start
timeout /t 2

REM Start frontend in a new window
start "MarketPulse Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ✨ Both servers are running in separate windows!
