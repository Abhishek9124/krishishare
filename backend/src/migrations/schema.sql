-- Krishishare schema
-- All money movement in this schema is simulated/virtual for demo purposes.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('fpo', 'investor', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fpo_profiles (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  fpo_name            VARCHAR(200) NOT NULL,
  registration_number VARCHAR(100),
  region              VARCHAR(150),
  description         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallets (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance    NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id          SERIAL PRIMARY KEY,
  wallet_id   INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type        VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
  amount      NUMERIC(14,2) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id                  SERIAL PRIMARY KEY,
  fpo_id              INTEGER NOT NULL REFERENCES fpo_profiles(id) ON DELETE CASCADE,
  crop_name           VARCHAR(150) NOT NULL,
  title               VARCHAR(200) NOT NULL,
  description         TEXT,
  region              VARCHAR(150),
  target_amount       NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
  raised_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  min_investment      NUMERIC(14,2) NOT NULL DEFAULT 500,
  expected_return_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  duration_days       INTEGER NOT NULL DEFAULT 120,
  funding_deadline    DATE,
  status              VARCHAR(25) NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open','funded','in_progress','harvested','settlement_pending','settled','cancelled')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investments (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  investor_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount       NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  status       VARCHAR(20) NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','settled','refunded','cancelled')),
  payout_amount NUMERIC(14,2),
  invested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS yield_settlements (
  id                SERIAL PRIMARY KEY,
  project_id        INTEGER NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  total_yield_value NUMERIC(14,2) NOT NULL,
  fpo_yield_value   NUMERIC(14,2),
  platform_fee_pct  NUMERIC(5,2) NOT NULL DEFAULT 5,
  platform_fee_amt  NUMERIC(14,2) NOT NULL DEFAULT 0,
  distributable_amt NUMERIC(14,2) NOT NULL DEFAULT 0,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes             TEXT,
  proof_docs        TEXT,
  reviewed_by       INTEGER REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  settled_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_telemetry (
  id                 SERIAL PRIMARY KEY,
  project_id         INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  crop_health_index  NUMERIC(5,2) NOT NULL DEFAULT 85.0,
  ndvi_score         NUMERIC(4,3) NOT NULL DEFAULT 0.750,
  temperature_c      NUMERIC(4,1) NOT NULL DEFAULT 28.5,
  rainfall_mm        NUMERIC(5,1) NOT NULL DEFAULT 12.0,
  soil_moisture_pct  NUMERIC(4,1) NOT NULL DEFAULT 45.0,
  status             VARCHAR(50) NOT NULL DEFAULT 'Optimal',
  notes              TEXT,
  recorded_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_investments_project ON investments(project_id);
CREATE INDEX IF NOT EXISTS idx_investments_investor ON investments(investor_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_project ON project_telemetry(project_id);
