# MarketPulse — Complete Project (Frontend + Backend)

A production-ready financial intelligence platform in a single VSCode workspace.

## Quick Start

### Option 1: VSCode Tasks (Recommended)

1. Open this folder in VSCode
2. Press `Cmd+Shift+B` (or `Ctrl+Shift+B` on Windows/Linux)
3. Select **"Run Full Stack"**
4. This starts both backend (port 4877) and frontend (port 5173) in split terminals

### Option 2: Manual

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Your app will be at **http://localhost:5173**

---

## What's Inside

```
marketpulse-complete/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── providers/          # Market data (Yahoo Finance + Demo)
│   │   ├── domain/             # Pure logic engines
│   │   ├── api/routes/         # REST endpoints
│   │   ├── db/                 # PostgreSQL schema
│   │   └── ...
│   ├── .env                    # Config: MARKET_DATA_MODE=yahoo
│   ├── package.json
│   └── docker-compose.yml
│
├── frontend/                   # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/              # Landing, Watchlist, Market, etc.
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # Auth state management
│   │   ├── data/               # Demo data
│   │   └── ...
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── .vscode/
│   ├── tasks.json              # VSCode tasks (Run Full Stack)
│   └── settings.json
│
└── README.md (this file)
```

---

## Features

### Frontend
- ✅ Premium landing page with hero chart
- ✅ Email + password authentication
- ✅ Phone + OTP delayed conversion
- ✅ Watchlist with dense financial rows
- ✅ Stock detail with metrics
- ✅ Market overview
- ✅ Responsive design (desktop/tablet/mobile)
- ✅ Dark + light theme support

### Backend
- ✅ Live market data via Yahoo Finance
- ✅ Domain-driven architecture
- ✅ PostgreSQL database
- ✅ Session-based auth
- ✅ REST API with validation
- ✅ Change detection engines
- ✅ Can switch to demo mode anytime

---

## Configuration

### Backend

Edit `backend/.env`:

```bash
MARKET_DATA_MODE=yahoo          # "yahoo" for live data, "demo" for synthetic
DATABASE_URL=postgresql://marketpulse:marketpulse@localhost:6543/marketpulse
PORT=4877
CORS_ORIGIN=http://localhost:5173
```

### Frontend

Optional: Create `frontend/.env`:

```bash
VITE_API_BASE=http://localhost:4877/api
```

---

## Database Setup

The backend uses PostgreSQL. You have two options:

### Option A: Docker (Easiest)

```bash
cd backend
docker-compose up -d
npm run db:migrate
npm run seed
```

### Option B: Local PostgreSQL

Install PostgreSQL, then:

```bash
createuser -P marketpulse     # Password: marketpulse
createdb -O marketpulse marketpulse
npm run db:migrate
npm run seed
```

---

## Switching Data Sources

### Use Live Yahoo Data
```bash
# In backend/.env
MARKET_DATA_MODE=yahoo
# Restart backend (Cmd+R in VSCode terminal or Ctrl+C + npm run dev)
```

### Use Demo/Synthetic Data
```bash
# In backend/.env
MARKET_DATA_MODE=demo
# Restart backend
```

The demo mode generates deterministic, realistic data that exercises all the logic engines without hitting external APIs.

---

## VSCode Setup

### Recommended Extensions

Install these for a smooth experience:

- **ES7+ React/Redux/React-Native snippets** (dsznajder.es7-react-js-snippets)
- **TypeScript Vue Plugin** (Vue.volar)
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **Thunder Client** or **REST Client** (for API testing)

All recommended extensions are listed in `.vscode/extensions.json` — VSCode will prompt you to install them.

### Useful Keyboard Shortcuts

- `Cmd+Shift+B` — Run Full Stack task
- `Cmd+J` — Toggle terminal panel
- `Cmd+K Cmd+S` — Keyboard shortcuts reference

---

## Testing the Full Stack

1. **Start the app** with VSCode task or manual commands
2. **Open browser** to http://localhost:5173
3. **See the landing page** with live market data
4. **Sign up** with any email/password
5. **View watchlist** with real stocks
6. **Click a stock** to see details
7. **Switch themes** in settings

---

## API Endpoints (for reference)

Backend runs on `http://localhost:4877`

```
GET    /api/market/status
GET    /api/market/indices
GET    /api/stocks/:symbol
POST   /api/watchlists
GET    /api/watchlists
POST   /api/watchlists/:id/mark-seen
GET    /api/search?q=...
POST   /api/auth/login
POST   /api/auth/signup
POST   /api/auth/logout
```

---

## Troubleshooting

### "Backend not connecting"
- Check if backend is running (`npm run dev` in `backend/` folder)
- Verify port 4877 is not blocked: `lsof -i :4877`
- Check CORS_ORIGIN in `backend/.env` includes `http://localhost:5173`

### "No market data showing"
- Check `MARKET_DATA_MODE=yahoo` (not `demo`)
- Restart backend after changing `.env`
- Check browser console (F12) for errors

### "Database connection failed"
- Make sure PostgreSQL is running (or Docker container)
- Verify `DATABASE_URL` in `backend/.env`
- Run `npm run db:migrate` in `backend/`

### Port already in use
```bash
# Change port in backend/.env
PORT=4878

# Or kill the process:
lsof -i :4877 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

---

## Build & Deploy

### Production Build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Upload dist/ folder to Vercel, Netlify, or similar
```

### Environment Variables (Production)

**Backend**
```
MARKET_DATA_MODE=yahoo
DATABASE_URL=postgresql://...production...
PORT=4877
CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production
```

**Frontend**
```
VITE_API_BASE=https://api.yourdomain.com/api
```

---

## Project Stats

- **Frontend**: 1000+ lines of React/TypeScript
- **Backend**: 3000+ lines of Node/TypeScript
- **Database**: 8 tables with proper schema
- **Tests**: 26 unit tests (domain engines)
- **Design**: 15 color tokens, responsive by default
- **Data**: 7 realistic stocks with full metrics

---

## Next Steps

1. ✅ Run the full stack
2. ✅ Test the user journey (landing → signup → app)
3. ✅ Customize colors/data in `frontend/src/data/demo-data.ts`
4. ✅ Add more stocks to the watchlist
5. ✅ Connect to your own database
6. ✅ Deploy to production

---

## Support

- **Backend README**: `backend/README.md`
- **Frontend README**: `frontend/MARKETPULSE_README.md`
- **Architecture**: See `backend/README.md` section "Full architecture"

---

**Built for Groww Code 2026 Hackathon** — A complete financial intelligence platform ready to run in your editor.

Happy hacking! 🚀
