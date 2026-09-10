# Krishishare — FPO-Backed Contract Farming Marketplace (Demo Build)

A working prototype of the flow from the Krishishare framework: **FPOs list crop projects → urban
investors fund them → FPO reports the harvest sale → payouts flow back to investors.**

**Everything financial in this build is simulated.** There is no real payment gateway, no real
bank escrow account, and no real securities being issued. Wallet balances are just numbers in a
Postgres table. If you ever want to move from this demo to handling real money from real investors,
that requires an actual compliance review (see note at the bottom) — this codebase does not clear
that bar on its own no matter what a pitch deck says about it.

## Stack
- **Backend**: Node.js, Express, PostgreSQL (`pg`), JWT auth, bcrypt password hashing
- **Frontend**: React (Vite), React Router, Axios

## Project structure
```
krishishare/
  backend/
    src/
      routes/         auth, projects, investments, wallet
      middleware/      JWT auth + role guard
      migrations/      schema.sql + runner
      db.js, server.js
  frontend/
    src/
      pages/           Login, Register, Projects, ProjectDetail, CreateProject, MyProjects, MyInvestments, Wallet
      components/      Navbar, ProjectCard, PrivateRoute
      context/         AuthContext (JWT session)
```

## Core data model
- `users` — role: `fpo` | `investor` | `admin`
- `fpo_profiles` — one per FPO user (name, registration number, region)
- `projects` — a crop project listed by an FPO (target amount, min investment, expected return %, status)
- `investments` — an investor's stake in a project
- `wallets` / `wallet_transactions` — simulated ledger per user
- `yield_settlements` — record of the harvest-sale payout event per project

Project status lifecycle: `open → funded → in_progress → harvested → settled` (or `cancelled`).

## Setup

### 1. Database
```bash
createdb krishishare
cd backend
cp .env.example .env
# edit .env: set DATABASE_URL, and a real random JWT_SECRET
npm install
npm run migrate      # applies schema.sql
npm run dev          # starts API on http://localhost:4000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev           # starts Vite dev server on http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:4000`, so just open
`http://localhost:5173`.

## Trying the core flow
1. Register two accounts: one as **FPO** (fills in FPO name/region), one as **Investor**
   (auto-gets a demo wallet balance, default ₹5,00,000 — configurable in `.env`).
2. Log in as the FPO → **List a Project** → fill in crop, target amount, expected return, duration.
3. Log in as the Investor → open the project → **Invest now** (deducts from the simulated wallet,
   updates the project's raised amount; project flips to `funded` once the target is hit).
4. Log in as the FPO again → **My Projects** → once status is `funded`/`in_progress`/`harvested`,
   enter the total sale value of the harvested yield and settle. This pays out each investor
   pro-rata to their share of the raise, minus the platform fee, straight into their wallet.
5. Log in as the Investor → **Wallet** / **My Investments** to see the payout land.

## API summary
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create FPO or investor account |
| POST | `/api/auth/login` | – | Get JWT |
| GET | `/api/projects` | – | List projects (optional `?status=`) |
| GET | `/api/projects/:id` | – | Project detail + investor stats |
| POST | `/api/projects` | FPO | List a new project |
| GET | `/api/projects/mine/fpo` | FPO | Your own listed projects |
| POST | `/api/projects/:id/settle` | FPO (owner) | Report harvest sale value, trigger payouts |
| POST | `/api/investments` | Investor | Invest in an open project |
| GET | `/api/investments/mine` | Investor | Your portfolio |
| GET | `/api/wallet` | Any | Balance + transaction history |

## What this build deliberately does NOT do
- No real payment gateway / bank escrow integration (would need Razorpay/Cashfree escrow-as-a-service
  or an actual scheduled bank, plus RBI-compliant nodal account structuring).
- No satellite/weather data integration (poster's "Parametric Satellite Shield" — would be a separate
  service calling a provider like Skymet, IBM EIS, or Sentinel Hub, feeding a claims-trigger engine).
- No KYC/AML checks on investors — required before ever touching real money.
- No securities/contract-farming legal structuring. The original poster claims this design is
  "100% exempt" from SEBI's Collective Investment Scheme rules and outside RBI's NBFC/P2P rules
  because payments are called "commercial advances" and routed through escrow. That claim needs an
  actual securities lawyer's sign-off before it's true in practice — regulators look at economic
  substance (pooled public money + expectation of profit from a third party's effort is the classic
  CIS test under Sec. 11AA of the SEBI Act), not the label the platform puts on the transaction.
  Treat this app as a demo/prototype until that review happens.
