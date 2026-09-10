const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { authRateLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin } = require('../middleware/validators');

const router = express.Router();

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'krishishare_demo_jwt_secret_key_2026';
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    secret,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', authRateLimiter, validateRegister, async (req, res) => {
  const { name, email, password, role, fpo_name, registration_number, region } = req.body;

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, role]
    );
    const user = userResult.rows[0];

    if (role === 'fpo') {
      await client.query(
        `INSERT INTO fpo_profiles (user_id, fpo_name, registration_number, region)
         VALUES ($1, $2, $3, $4)`,
        [user.id, fpo_name, registration_number || null, region || null]
      );
    }

    const startingBalance = role === 'investor'
      ? Number(process.env.DEMO_INVESTOR_STARTING_BALANCE || 500000)
      : 0;

    const walletResult = await client.query(
      `INSERT INTO wallets (user_id, balance) VALUES ($1, $2) RETURNING id`,
      [user.id, startingBalance]
    );

    if (startingBalance > 0) {
      await client.query(
        `INSERT INTO wallet_transactions (wallet_id, type, amount, description)
         VALUES ($1, 'credit', $2, 'Demo starting balance (simulated funds, not real money)')`,
        [walletResult.rows[0].id, startingBalance]
      );
    }

    await client.query('COMMIT');

    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {
        console.error('Rollback error:', rbErr.message);
      }
    }
    console.error('Registration error:', err.message || err);
    return res.status(500).json({ error: err.message || 'Registration failed' });
  } finally {
    if (client) client.release();
  }
});

// POST /api/auth/login
router.post('/login', authRateLimiter, validateLogin, async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
