require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const isLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);

    // Apply incremental schema updates for existing DBs
    try {
      await pool.query(`
        ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
        ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK (status IN ('open','funded','in_progress','harvested','settlement_pending','settled','cancelled'));
      `);
      await pool.query(`
        ALTER TABLE yield_settlements ADD COLUMN IF NOT EXISTS fpo_yield_value NUMERIC(14,2);
        ALTER TABLE yield_settlements ADD COLUMN IF NOT EXISTS proof_docs TEXT;
        ALTER TABLE yield_settlements ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id);
        ALTER TABLE yield_settlements ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
        ALTER TABLE yield_settlements ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      `);
    } catch (alterErr) {
      console.log('Incremental alter note:', alterErr.message);
    }

    // Seed default admin account if not present
    const adminRes = await pool.query("SELECT id FROM users WHERE email = 'admin@krishishare.com'");
    if (adminRes.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      const userRes = await pool.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ('Platform Admin', 'admin@krishishare.com', $1, 'admin') RETURNING id",
        [hash]
      );
      await pool.query("INSERT INTO wallets (user_id, balance) VALUES ($1, 0)", [userRes.rows[0].id]);
      console.log('Seeded default admin user: admin@krishishare.com / admin123');
    }

    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
