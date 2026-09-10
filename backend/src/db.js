require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

const isSupabase = connectionString && (connectionString.includes('supabase.co') || connectionString.includes('supabase.com') || connectionString.includes('pooler.supabase.com'));
const isLocal = !connectionString || connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

let realPool = null;
if (connectionString) {
  try {
    realPool = new Pool({
      connectionString,
      ssl: (isSupabase || !isLocal) ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
    });
    realPool.on('error', (err) => {
      console.error('Idle Supabase client error:', err.message);
    });
  } catch (e) {
    console.error('Failed to initialize PG pool:', e);
  }
}

// In-Memory Fallback Store for Instant Zero-Config Demo
const adminHash = bcrypt.hashSync('admin123', 10);
const demoHash = bcrypt.hashSync('password123', 10);

const memoryUsers = [
  { id: 1, name: 'Platform Admin', email: 'admin@krishishare.com', password_hash: adminHash, role: 'admin', created_at: new Date() },
  { id: 2, name: 'Nashik Farmers Co-op', email: 'fpo_demo@krishishare.com', password_hash: demoHash, role: 'fpo', created_at: new Date() },
  { id: 3, name: 'Demo Urban Investor', email: 'investor_demo@krishishare.com', password_hash: demoHash, role: 'investor', created_at: new Date() },
];

const memoryFpos = [
  { id: 1, user_id: 2, fpo_name: 'Nashik Grape Farmers Co-op', registration_number: 'REG-2026-MH-881', region: 'Nashik, Maharashtra', description: 'Grape and pomegranate producer organization.' },
];

const memoryWallets = [
  { id: 1, user_id: 1, balance: '0.00', updated_at: new Date() },
  { id: 2, user_id: 2, balance: '0.00', updated_at: new Date() },
  { id: 3, user_id: 3, balance: '500000.00', updated_at: new Date() },
];

const memoryWalletTx = [
  { id: 1, wallet_id: 3, type: 'credit', amount: '500000.00', description: 'Demo starting balance', created_at: new Date() },
];

const memoryProjects = [
  {
    id: 1,
    fpo_id: 1,
    crop_name: 'Export Quality Table Grapes',
    title: '50-Acre Nashik Vineyard Cluster Harvest 2026',
    description: 'High-yield table grape contract farming cluster utilizing drip irrigation and solar cold storage.',
    region: 'Nashik, Maharashtra',
    target_amount: '500000.00',
    raised_amount: '250000.00',
    min_investment: '1000.00',
    expected_return_pct: '18.50',
    duration_days: 120,
    status: 'open',
    created_at: new Date(),
    fpo_name: 'Nashik Grape Farmers Co-op',
    fpo_region: 'Nashik, Maharashtra',
  },
  {
    id: 2,
    fpo_id: 1,
    crop_name: 'Kharif Soybean',
    title: 'Organic Soybean Crop Cycle - Latur Belt',
    description: 'Certified organic soybean production cluster supported by FPO input purchasing.',
    region: 'Latur, Maharashtra',
    target_amount: '300000.00',
    raised_amount: '300000.00',
    min_investment: '500.00',
    expected_return_pct: '15.00',
    duration_days: 90,
    status: 'funded',
    created_at: new Date(),
    fpo_name: 'Nashik Grape Farmers Co-op',
    fpo_region: 'Nashik, Maharashtra',
  },
];

const memoryInvestments = [
  { id: 1, project_id: 2, investor_id: 3, amount: '300000.00', status: 'active', payout_amount: null, invested_at: new Date(), settled_at: null },
];

const memorySettlements = [];
const memoryTelemetry = [
  {
    id: 1,
    project_id: 1,
    crop_health_index: '88.50',
    ndvi_score: '0.785',
    temperature_c: '27.4',
    rainfall_mm: '14.2',
    soil_moisture_pct: '48.0',
    status: 'Optimal',
    notes: 'Sentinel-2 Multispectral Imagery Baseline Scan',
    recorded_at: new Date(),
  },
];

let useMemoryFallback = !realPool;

const query = async (text, params = []) => {
  if (realPool && !useMemoryFallback) {
    try {
      return await realPool.query(text, params);
    } catch (err) {
      console.warn('Postgres connection failed, switching to high-availability demo memory store:', err.message);
      useMemoryFallback = true;
    }
  }

  // Memory Query Fallback Engine
  const sql = text.trim();

  // USERS
  if (sql.includes('SELECT * FROM users WHERE email = $1') || sql.includes('SELECT id FROM users WHERE email = $1')) {
    const user = memoryUsers.find((u) => u.email.toLowerCase() === (params[0] || '').toLowerCase());
    return { rows: user ? [user] : [] };
  }
  if (sql.includes('INSERT INTO users')) {
    const newId = memoryUsers.length + 1;
    const newUser = { id: newId, name: params[0], email: params[1], password_hash: params[2], role: params[3], created_at: new Date() };
    memoryUsers.push(newUser);
    return { rows: [newUser] };
  }
  if (sql.includes('SELECT') && sql.includes('FROM users u')) {
    const rows = memoryUsers.map((u) => {
      const w = memoryWallets.find((wal) => wal.user_id === u.id);
      const f = memoryFpos.find((fpo) => fpo.user_id === u.id);
      return { ...u, wallet_balance: w ? w.balance : '0.00', fpo_name: f ? f.fpo_name : null, fpo_region: f ? f.region : null };
    });
    return { rows };
  }

  // FPO PROFILES
  if (sql.includes('SELECT id FROM fpo_profiles WHERE user_id = $1') || sql.includes('SELECT * FROM fpo_profiles WHERE user_id = $1')) {
    const fpo = memoryFpos.find((f) => f.user_id === Number(params[0]));
    return { rows: fpo ? [fpo] : [] };
  }
  if (sql.includes('INSERT INTO fpo_profiles')) {
    const newFpo = { id: memoryFpos.length + 1, user_id: params[0], fpo_name: params[1], registration_number: params[2], region: params[3] };
    memoryFpos.push(newFpo);
    return { rows: [newFpo] };
  }

  // WALLETS
  if (sql.includes('SELECT * FROM wallets WHERE user_id = $1') || sql.includes('SELECT id FROM wallets WHERE user_id = $1')) {
    let w = memoryWallets.find((wal) => wal.user_id === Number(params[0]));
    if (!w) {
      w = { id: memoryWallets.length + 1, user_id: Number(params[0]), balance: '0.00', updated_at: new Date() };
      memoryWallets.push(w);
    }
    return { rows: [w] };
  }
  if (sql.includes('INSERT INTO wallets')) {
    const w = { id: memoryWallets.length + 1, user_id: params[0], balance: String(params[1] || 0), updated_at: new Date() };
    memoryWallets.push(w);
    return { rows: [w] };
  }
  if (sql.includes('UPDATE wallets SET balance = balance +')) {
    const w = memoryWallets.find((wal) => wal.id === Number(params[1]));
    if (w) w.balance = String(Number(w.balance) + Number(params[0]));
    return { rows: w ? [w] : [] };
  }
  if (sql.includes('UPDATE wallets SET balance = balance -')) {
    const w = memoryWallets.find((wal) => wal.id === Number(params[1]));
    if (w) w.balance = String(Number(w.balance) - Number(params[0]));
    return { rows: w ? [w] : [] };
  }

  // WALLET TRANSACTIONS
  if (sql.includes('INSERT INTO wallet_transactions')) {
    const tx = { id: memoryWalletTx.length + 1, wallet_id: params[0], type: params[1], amount: String(params[2]), description: params[3], created_at: new Date() };
    memoryWalletTx.push(tx);
    return { rows: [tx] };
  }
  if (sql.includes('SELECT * FROM wallet_transactions WHERE wallet_id = $1')) {
    const txs = memoryWalletTx.filter((t) => t.wallet_id === Number(params[0]));
    return { rows: txs };
  }

  // PROJECTS
  if (sql.includes('SELECT p.*, f.fpo_name')) {
    let rows = memoryProjects.map((p) => {
      const f = memoryFpos.find((fpo) => fpo.id === p.fpo_id);
      return { ...p, fpo_name: f ? f.fpo_name : 'Nashik Farmers Co-op', fpo_region: f ? f.region : 'Nashik' };
    });
    if (params[0]) rows = rows.filter((r) => r.status === params[0]);
    return { rows };
  }
  if (sql.includes('SELECT p.*, f.fpo_name, f.region AS fpo_region, f.description AS fpo_description')) {
    const p = memoryProjects.find((proj) => proj.id === Number(params[0]));
    if (!p) return { rows: [] };
    const f = memoryFpos.find((fpo) => fpo.id === p.fpo_id);
    return { rows: [{ ...p, fpo_name: f ? f.fpo_name : 'Nashik Farmers Co-op', fpo_region: f ? f.region : 'Nashik', fpo_description: f ? f.description : '' }] };
  }
  if (sql.includes('SELECT * FROM projects WHERE fpo_id = $1') || sql.includes('FROM projects p') && sql.includes('WHERE p.fpo_id = $1')) {
    const rows = memoryProjects.filter((p) => p.fpo_id === Number(params[0]));
    return { rows };
  }
  if (sql.includes('SELECT * FROM projects WHERE id = $1')) {
    const p = memoryProjects.find((proj) => proj.id === Number(params[0]));
    return { rows: p ? [p] : [] };
  }
  if (sql.includes('INSERT INTO projects')) {
    const newP = {
      id: memoryProjects.length + 1,
      fpo_id: params[0],
      crop_name: params[1],
      title: params[2],
      description: params[3],
      region: params[4],
      target_amount: String(params[5]),
      raised_amount: '0.00',
      min_investment: String(params[6] || 500),
      expected_return_pct: String(params[7] || 0),
      duration_days: params[8] || 120,
      funding_deadline: params[9] || null,
      status: 'open',
      created_at: new Date(),
    };
    memoryProjects.push(newP);
    return { rows: [newP] };
  }
  if (sql.includes('UPDATE projects SET raised_amount = $1, status = $2 WHERE id = $3')) {
    const p = memoryProjects.find((proj) => proj.id === Number(params[2]));
    if (p) {
      p.raised_amount = String(params[0]);
      p.status = params[1];
    }
    return { rows: p ? [p] : [] };
  }
  if (sql.includes('UPDATE projects SET status =')) {
    const p = memoryProjects.find((proj) => proj.id === Number(params[0]));
    if (p) {
      const match = sql.match(/SET status = '([^']+)'/);
      if (match) p.status = match[1];
    }
    return { rows: p ? [p] : [] };
  }

  // INVESTMENTS
  if (sql.includes('SELECT COUNT(*)::int AS investor_count, COALESCE(SUM(amount), 0) AS total_invested FROM investments')) {
    const invs = memoryInvestments.filter((i) => i.project_id === Number(params[0]));
    const total = invs.reduce((s, i) => s + Number(i.amount), 0);
    return { rows: [{ investor_count: invs.length, total_invested: total }] };
  }
  if (sql.includes('INSERT INTO investments')) {
    const inv = { id: memoryInvestments.length + 1, project_id: params[0], investor_id: params[1], amount: String(params[2]), status: 'active', payout_amount: null, invested_at: new Date(), settled_at: null };
    memoryInvestments.push(inv);
    return { rows: [inv] };
  }
  if (sql.includes('SELECT i.*, p.title, p.crop_name')) {
    const invs = memoryInvestments
      .filter((i) => i.investor_id === Number(params[0]))
      .map((i) => {
        const p = memoryProjects.find((proj) => proj.id === i.project_id);
        return { ...i, title: p ? p.title : '', crop_name: p ? p.crop_name : '', project_status: p ? p.status : '', expected_return_pct: p ? p.expected_return_pct : '', fpo_name: 'Nashik Farmers Co-op' };
      });
    return { rows: invs };
  }
  if (sql.includes('SELECT * FROM investments WHERE project_id = $1')) {
    const invs = memoryInvestments.filter((i) => i.project_id === Number(params[0]));
    return { rows: invs };
  }
  if (sql.includes('UPDATE investments SET status =')) {
    const inv = memoryInvestments.find((i) => i.id === Number(params[1]));
    if (inv) {
      inv.status = 'settled';
      inv.payout_amount = String(params[0]);
      inv.settled_at = new Date();
    }
    return { rows: inv ? [inv] : [] };
  }

  // YIELD SETTLEMENTS
  if (sql.includes('SELECT ys.*, reviewer.name AS reviewer_name')) {
    const s = memorySettlements.find((set) => set.project_id === Number(params[0]));
    return { rows: s ? [s] : [] };
  }
  if (sql.includes('INSERT INTO yield_settlements')) {
    const existingIdx = memorySettlements.findIndex((set) => set.project_id === Number(params[0]));
    const record = {
      id: existingIdx >= 0 ? memorySettlements[existingIdx].id : memorySettlements.length + 1,
      project_id: params[0],
      total_yield_value: String(params[1]),
      fpo_yield_value: String(params[1]),
      platform_fee_pct: String(params[2] || 5),
      platform_fee_amt: String(params[3] || 0),
      distributable_amt: String(params[4] || 0),
      status: 'pending',
      notes: params[5] || 'Harvest yield sold in mandi',
      proof_docs: params[6] || 'FPO Mandi Sales Receipt',
      settled_at: new Date(),
    };
    if (existingIdx >= 0) memorySettlements[existingIdx] = record;
    else memorySettlements.push(record);
    return { rows: [record] };
  }
  if (sql.includes('SELECT ys.*, p.title AS project_title')) {
    const rows = memorySettlements.map((s) => {
      const p = memoryProjects.find((proj) => proj.id === s.project_id);
      return { ...s, project_title: p ? p.title : '', crop_name: p ? p.crop_name : '', raised_amount: p ? p.raised_amount : '0', project_status: p ? p.status : '', fpo_name: 'Nashik Farmers Co-op', fpo_user_name: 'Ramesh Patil', fpo_email: 'fpo_demo@krishishare.com' };
    });
    return { rows };
  }
  if (sql.includes('SELECT * FROM yield_settlements WHERE id = $1')) {
    const s = memorySettlements.find((set) => set.id === Number(params[0]));
    return { rows: s ? [s] : [] };
  }
  if (sql.includes('UPDATE yield_settlements SET total_yield_value =')) {
    const s = memorySettlements.find((set) => set.id === Number(params[5]));
    if (s) {
      s.total_yield_value = String(params[0]);
      s.platform_fee_pct = String(params[1]);
      s.platform_fee_amt = String(params[2]);
      s.distributable_amt = String(params[3]);
      s.status = 'approved';
      s.reviewed_by = params[4];
      s.reviewed_at = new Date();
    }
    return { rows: s ? [s] : [] };
  }
  if (sql.includes('UPDATE yield_settlements SET status = \'rejected\'')) {
    const s = memorySettlements.find((set) => set.id === Number(params[2]));
    if (s) {
      s.status = 'rejected';
      s.rejection_reason = params[0];
      s.reviewed_by = params[1];
      s.reviewed_at = new Date();
    }
    return { rows: s ? [s] : [] };
  }

  // TELEMETRY
  if (sql.includes('SELECT * FROM project_telemetry WHERE project_id = $1')) {
    let rows = memoryTelemetry.filter((t) => t.project_id === Number(params[0]));
    return { rows };
  }
  if (sql.includes('INSERT INTO project_telemetry')) {
    const t = {
      id: memoryTelemetry.length + 1,
      project_id: params[0],
      crop_health_index: String(params[1]),
      ndvi_score: String(params[2]),
      temperature_c: String(params[3]),
      rainfall_mm: String(params[4]),
      soil_moisture_pct: String(params[5]),
      status: params[6],
      notes: params[7],
      recorded_at: new Date(),
    };
    memoryTelemetry.push(t);
    return { rows: [t] };
  }

  // ADMIN OVERVIEW STATS
  if (sql.includes('total_users') && sql.includes('total_fpos')) {
    return {
      rows: [
        {
          total_users: memoryUsers.length,
          total_fpos: memoryUsers.filter((u) => u.role === 'fpo').length,
          total_investors: memoryUsers.filter((u) => u.role === 'investor').length,
        },
      ],
    };
  }
  if (sql.includes('total_projects') && sql.includes('total_raised_amount')) {
    const totalRaised = memoryProjects.reduce((s, p) => s + Number(p.raised_amount), 0);
    const totalTarget = memoryProjects.reduce((s, p) => s + Number(p.target_amount), 0);
    return {
      rows: [
        {
          total_projects: memoryProjects.length,
          total_target_amount: totalTarget,
          total_raised_amount: totalRaised,
          pending_settlements_count: memoryProjects.filter((p) => p.status === 'settlement_pending').length,
          settled_projects_count: memoryProjects.filter((p) => p.status === 'settled').length,
        },
      ],
    };
  }
  if (sql.includes('total_payouts_distributed')) {
    const approved = memorySettlements.filter((s) => s.status === 'approved');
    const totalPayouts = approved.reduce((s, a) => s + Number(a.distributable_amt), 0);
    const totalFees = approved.reduce((s, a) => s + Number(a.platform_fee_amt), 0);
    return {
      rows: [
        {
          total_payouts_distributed: totalPayouts,
          total_platform_fees_collected: totalFees,
        },
      ],
    };
  }

  // Default fallback empty result
  return { rows: [] };
};

const connect = async () => {
  if (realPool && !useMemoryFallback) {
    try {
      const client = await realPool.connect();
      return client;
    } catch (e) {
      console.warn('Pool connect failed, using memory mock transaction runner:', e.message);
      useMemoryFallback = true;
    }
  }

  // Return mocked transaction client
  return {
    query: async (text, params) => query(text, params),
    release: () => {},
  };
};

module.exports = {
  pool: {
    query,
    connect,
  },
};
