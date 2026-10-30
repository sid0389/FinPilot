# FinPilot — AI-Powered Financial Intelligence

FinPilot analyzes your income, expenses, risk tolerance, and goals to recommend the best investment market for your profile — Stocks, Crypto, or Forex.

## Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS       |
| Routing  | React Router DOM v6                |
| Charts   | Recharts                           |
| Animations | Framer Motion                    |
| Toasts   | React Hot Toast                    |
| Backend  | Node.js + Express                  |
| Database | MongoDB + Mongoose (optional)      |
| AI       | Anthropic Claude API (optional)    |

---

## Quick Start

### 1. Frontend only (no backend needed)
```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
# Demo login: demo@finpilot.app / 123456789
```

### 2. With Backend + Database + AI

**Backend setup:**
```bash
cd backend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
# API runs at http://localhost:5000
```

**Frontend setup:**
```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

---

## Environment Variables

### Backend `.env`
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/finpilot
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ANTHROPIC_API_KEY=sk-ant-...your-key...
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
```

---

## MongoDB Setup (Free)

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Create free account
2. Create a free M0 cluster
3. Create a database user and whitelist your IP
4. Copy the connection string into `MONGODB_URI`

**The app works without MongoDB** — it falls back to localStorage automatically.

---

## AI Chatbot Setup

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Add it to `backend/.env` as `ANTHROPIC_API_KEY`

**The chatbot works without an API key** — it uses helpful fallback responses.

---

## Features

- **Landing Page** — Modern hero with features, stats, and CTA
- **Auth** — Register/Login with localStorage + optional backend JWT
- **Dashboard** — Stat cards, area chart, pie chart, AI insights, quick actions
- **Expense Tracker** — 8-category expense input with live pie + bar charts
- **Risk Assessment** — 6-question quiz with animated score ring
- **Recommendation** — 5-factor engine ranking 3 markets with radar chart
- **Market Comparison** — Radar, bar chart, feature matrix, future roadmap
- **Profile** — Account settings, financial overview, danger zone
- **AI Chatbot** — Floating chat widget powered by Claude API

---

## Project Structure

```
FinPilot/
├── frontend/
│   ├── src/
│   │   ├── context/         # AuthContext, FinanceContext
│   │   ├── pages/           # All 9 pages
│   │   ├── components/      # Chatbot, shared components
│   │   ├── services/        # api.js (backend HTTP client)
│   │   ├── App.jsx          # Routes
│   │   └── index.css        # Global styles + Tailwind
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── controllers/         # authController, financeController, chatController
│   ├── models/              # User, Finance models
│   ├── routes/              # auth, finance, chat routes
│   ├── middleware/          # JWT auth middleware
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Disclaimer

FinPilot is for **educational purposes only**. It is not financial advice. Always consult a SEBI-registered investment advisor before making real investment decisions.
