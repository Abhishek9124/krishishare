const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/wallet  - current user's simulated wallet balance + recent transactions
router.get('/', requireAuth, async (req, res) => {
  try {
    const walletResult = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]);
    const wallet = walletResult.rows[0];
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const txResult = await pool.query(
      'SELECT * FROM wallet_transactions WHERE wallet_id = $1 ORDER BY created_at DESC LIMIT 50',
      [wallet.id]
    );

    return res.json({ balance: wallet.balance, transactions: txResult.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

module.exports = router;
