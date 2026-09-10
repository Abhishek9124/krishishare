require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

const isSupabase = connectionString && (connectionString.includes('supabase.co') || connectionString.includes('supabase.com') || connectionString.includes('pooler.supabase.com'));
const isLocal = !connectionString || connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  ssl: (isSupabase || !isLocal) ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Supabase Postgres client', err);
});

module.exports = { pool };
