const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply admin guard to all routes in this file
router.use(requireAuth, requireRole('admin'));

// GET /api/admin/overview - Platform-wide statistics
router.get('/overview', async (req, res) => {
  try {
    const userCounts = await pool.query(`
      SELECT
        COUNT(*)::int AS total_users,
        COUNT(CASE WHEN role = 'fpo' THEN 1 END)::int AS total_fpos,
        COUNT(CASE WHEN role = 'investor' THEN 1 END)::int AS total_investors
      FROM users
    `);

    const projectStats = await pool.query(`
      SELECT
        COUNT(*)::int AS total_projects,
        COALESCE(SUM(target_amount), 0) AS total_target_amount,
        COALESCE(SUM(raised_amount), 0) AS total_raised_amount,
        COUNT(CASE WHEN status = 'settlement_pending' THEN 1 END)::int AS pending_settlements_count,
        COUNT(CASE WHEN status = 'settled' THEN 1 END)::int AS settled_projects_count
      FROM projects
    `);

    const settlementStats = await pool.query(`
      SELECT
        COALESCE(SUM(distributable_amt), 0) AS total_payouts_distributed,
        COALESCE(SUM(platform_fee_amt), 0) AS total_platform_fees_collected
      FROM yield_settlements
      WHERE status = 'approved'
    `);

    return res.json({
      users: userCounts.rows[0],
      projects: projectStats.rows[0],
      settlements: settlementStats.rows[0],
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    return res.status(500).json({ error: 'Failed to fetch admin overview' });
  }
});

// GET /api/admin/settlements - List pending and past settlements
router.get('/settlements', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ys.*, p.title AS project_title, p.crop_name, p.raised_amount, p.status AS project_status,
             f.fpo_name, u.name AS fpo_user_name, u.email AS fpo_email,
             reviewer.name AS reviewer_name
      FROM yield_settlements ys
      JOIN projects p ON p.id = ys.project_id
      JOIN fpo_profiles f ON f.id = p.fpo_id
      JOIN users u ON u.id = f.user_id
      LEFT JOIN users reviewer ON reviewer.id = ys.reviewed_by
      ORDER BY CASE WHEN ys.status = 'pending' THEN 0 ELSE 1 END, ys.settled_at DESC
    `);
    return res.json(result.rows);
  } catch (err) {
    console.error('Admin settlements error:', err);
    return res.status(500).json({ error: 'Failed to fetch settlement audit queue' });
  }
});

// POST /api/admin/settlements/:id/approve - Third-party audit approval and payout execution
router.post('/settlements/:id/approve', async (req, res) => {
  const settlementId = req.params.id;
  const { confirmed_yield_value, platform_fee_pct } = req.body;

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const ysRes = await client.query('SELECT * FROM yield_settlements WHERE id = $1 FOR UPDATE', [settlementId]);
    const ys = ysRes.rows[0];
    if (!ys) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Settlement request not found' });
    }
    if (ys.status === 'approved') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Settlement has already been approved' });
    }

    const projectId = ys.project_id;
    const projectRes = await client.query('SELECT * FROM projects WHERE id = $1 FOR UPDATE', [projectId]);
    const project = projectRes.rows[0];
    if (!project) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Associated project not found' });
    }

    const finalYieldValue = confirmed_yield_value != null ? Number(confirmed_yield_value) : Number(ys.fpo_yield_value || ys.total_yield_value);
    const feePct = platform_fee_pct != null ? Number(platform_fee_pct) : Number(ys.platform_fee_pct || 5);

    if (finalYieldValue <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Confirmed yield value must be positive' });
    }

    const feeAmt = finalYieldValue * (feePct / 100);
    const distributable = finalYieldValue - feeAmt;

    // Update yield settlement status
    await client.query(
      `UPDATE yield_settlements
       SET total_yield_value = $1, platform_fee_pct = $2, platform_fee_amt = $3,
           distributable_amt = $4, status = 'approved', reviewed_by = $5, reviewed_at = now()
       WHERE id = $6`,
      [finalYieldValue, feePct, feeAmt, distributable, req.user.id, settlementId]
    );

    // Distribute payouts to investors
    const investments = await client.query(
      `SELECT * FROM investments WHERE project_id = $1 AND status = 'active'`,
      [projectId]
    );

    const totalRaised = Number(project.raised_amount);
    let investorCount = 0;

    for (const inv of investments.rows) {
      const share = totalRaised > 0 ? Number(inv.amount) / totalRaised : 0;
      const payout = Math.round(distributable * share * 100) / 100;

      await client.query(
        `UPDATE investments SET status = 'settled', payout_amount = $1, settled_at = now() WHERE id = $2`,
        [payout, inv.id]
      );

      const walletRes = await client.query('SELECT id FROM wallets WHERE user_id = $1', [inv.investor_id]);
      if (walletRes.rows.length > 0) {
        const walletId = walletRes.rows[0].id;
        await client.query(
          'UPDATE wallets SET balance = balance + $1, updated_at = now() WHERE id = $2',
          [payout, walletId]
        );
        await client.query(
          `INSERT INTO wallet_transactions (wallet_id, type, amount, description)
           VALUES ($1, 'credit', $2, $3)`,
          [walletId, payout, `Audited yield settlement payout for project #${projectId} (${project.title})`]
        );
      }
      investorCount++;
    }

    // Update project status to settled
    await client.query("UPDATE projects SET status = 'settled' WHERE id = $1", [projectId]);

    await client.query('COMMIT');
    return res.json({
      message: 'Settlement audit approved and payouts distributed successfully',
      confirmed_yield_value: finalYieldValue,
      platform_fee_amt: feeAmt,
      distributable_amt: distributable,
      investors_paid: investorCount,
    });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {
        console.error('Rollback error:', rbErr);
      }
    }
    console.error('Approval error:', err);
    return res.status(500).json({ error: err.message || 'Failed to approve settlement' });
  } finally {
    if (client) client.release();
  }
});

// POST /api/admin/settlements/:id/reject - Reject settlement proposal
router.post('/settlements/:id/reject', async (req, res) => {
  const settlementId = req.params.id;
  const { rejection_reason } = req.body;

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const ysRes = await client.query('SELECT * FROM yield_settlements WHERE id = $1 FOR UPDATE', [settlementId]);
    const ys = ysRes.rows[0];
    if (!ys) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Settlement request not found' });
    }

    await client.query(
      `UPDATE yield_settlements
       SET status = 'rejected', rejection_reason = $1, reviewed_by = $2, reviewed_at = now()
       WHERE id = $3`,
      [rejection_reason || 'Insufficient harvest sales proof', req.user.id, settlementId]
    );

    // Revert project status back to harvested so FPO can update proof
    await client.query("UPDATE projects SET status = 'harvested' WHERE id = $1", [ys.project_id]);

    await client.query('COMMIT');
    return res.json({ message: 'Settlement proposal rejected successfully' });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {
        console.error('Rollback error:', rbErr);
      }
    }
    console.error('Rejection error:', err);
    return res.status(500).json({ error: err.message || 'Failed to reject settlement' });
  } finally {
    if (client) client.release();
  }
});

// GET /api/admin/users - User directory with wallet balances
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.created_at,
             w.balance AS wallet_balance,
             f.fpo_name, f.region AS fpo_region
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      LEFT JOIN fpo_profiles f ON f.user_id = u.id
      ORDER BY u.created_at DESC
    `);
    return res.json(result.rows);
  } catch (err) {
    console.error('Admin users error:', err);
    return res.status(500).json({ error: 'Failed to fetch user list' });
  }
});

module.exports = router;
