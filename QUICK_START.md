# Quick Start Guide

Choose one of the options below:

## 🔧 Option 1: VSCode (Recommended)

1. Open this folder in VSCode
2. Press `Cmd+Shift+B` (or `Ctrl+Shift+B` on Windows/Linux)
3. Select **"Run Full Stack"**
4. Backend starts on port 4877, frontend on port 5173

## 🚀 Option 2: Terminal Commands

```bash
# Install dependencies (once)
npm run install-all

# Start both (in same terminal)
npm run dev

# Or start individually
npm run dev:backend      # Terminal 1
npm run dev:frontend     # Terminal 2 (new)
```

## 🎯 Option 3: One-Click Scripts

### macOS/Linux
```bash
./QUICK_START.sh
```

### Windows
```bash
QUICK_START.bat
```

---

## What to Do Next

1. **Open browser** → http://localhost:5173
2. **See the landing page** with live market data
3. **Sign up** with email + password
4. **Explore the app** → Watchlist, Market, Stock details
5. **Customize** → Edit data in `frontend/src/data/demo-data.ts`

---

## Configuration

### Switch Data Source

In `backend/.env`:
- `MARKET_DATA_MODE=yahoo` → Live Yahoo Finance data
- `MARKET_DATA_MODE=demo` → Deterministic synthetic data

Restart backend after changing.

### Database

Make sure PostgreSQL is running, or use Docker:
```bash
cd backend
docker-compose up -d
npm run db:migrate
npm run seed
```

---

## Support

- **Full README** → `README.md`
- **Backend Docs** → `backend/README.md`
- **Frontend Docs** → `frontend/MARKETPULSE_README.md`
