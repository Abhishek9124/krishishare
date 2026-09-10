const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateInvestment } = require('../middleware/validators');

const router = express.Router();

// POST /api/investments  (investor only)
router.post('/', requireAuth, requireRole('investor'), validateInvestment, async (req, res) => {
  const { project_id, amount } = req.body;
  const investAmount = Number(amount);

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const projectResult = await client.query(
      'SELECT * FROM projects WHERE id = $1 FOR UPDATE',
      [project_id]
    );
    const project = projectResult.rows[0];
    if (!project) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.status !== 'open') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This project is not open for funding' });
    }
    if (investAmount < Number(project.min_investment)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Minimum investment is ₹${project.min_investment}` });
    }

    const remaining = Number(project.target_amount) - Number(project.raised_amount);
    if (investAmount > remaining) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Only ₹${remaining.toLocaleString('en-IN')} remaining to fully fund this project` });
    }

    const walletResult = await client.query(
      'SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE',
      [req.user.id]
    );
    const wallet = walletResult.rows[0];
    if (!wallet || Number(wallet.balance) < investAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient wallet balance (simulated wallet)' });
    }

    // Debit investor wallet
    await client.query(
      'UPDATE wallets SET balance = balance - $1, updated_at = now() WHERE id = $2',
      [investAmount, wallet.id]
    );
    await client.query(
      `INSERT INTO wallet_transactions (wallet_id, type, amount, description)
       VALUES ($1, 'debit', $2, $3)`,
      [wallet.id, investAmount, `Investment in project #${project_id} (${project.title})`]
    );

    // Record investment
    const investmentResult = await client.query(
      `INSERT INTO investments (project_id, investor_id, amount)
       VALUES ($1, $2, $3) RETURNING *`,
      [project_id, req.user.id, investAmount]
    );

    // Update project raised_amount, flip status if fully funded
    const newRaised = Number(project.raised_amount) + investAmount;
    const newStatus = newRaised >= Number(project.target_amount) ? 'funded' : project.status;
    await client.query(
      'UPDATE projects SET raised_amount = $1, status = $2 WHERE id = $3',
      [newRaised, newStatus, project_id]
    );

    await client.query('COMMIT');
    return res.status(201).json({
      investment: investmentResult.rows[0],
      project_status: newStatus,
      project_raised_amount: newRaised,
    });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {
        console.error('Rollback error:', rbErr.message);
      }
    }
    console.error('Investment error:', err.message || err);
    return res.status(500).json({ error: err.message || 'Investment failed' });
  } finally {
    if (client) client.release();
  }
});

// GET /api/investments/mine  (investor portfolio)
router.get('/mine', requireAuth, requireRole('investor'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, p.title, p.crop_name, p.status AS project_status, p.expected_return_pct,
              f.fpo_name
       FROM investments i
       JOIN projects p ON p.id = i.project_id
       JOIN fpo_profiles f ON f.id = p.fpo_id
       WHERE i.investor_id = $1
       ORDER BY i.invested_at DESC`,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching investments:', err);
    return res.status(500).json({ error: 'Failed to fetch your investments' });
  }
});

module.exports = router;
