const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateCreateProject, validateSettlementRequest } = require('../middleware/validators');

const router = express.Router();

// GET /api/projects  (public list, with optional ?status= filter)
router.get('/', async (req, res) => {
  const { status } = req.query;
  try {
    const params = [];
    let query = `
      SELECT p.*, f.fpo_name, f.region AS fpo_region
      FROM projects p
      JOIN fpo_profiles f ON f.id = p.fpo_id
    `;
    if (status) {
      params.push(status);
      query += ` WHERE p.status = $1`;
    }
    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching projects:', err);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id  (detail + investor count & settlement audit info)
router.get('/:id', async (req, res) => {
  try {
    const projectResult = await pool.query(
      `SELECT p.*, f.fpo_name, f.region AS fpo_region, f.description AS fpo_description
       FROM projects p JOIN fpo_profiles f ON f.id = p.fpo_id
       WHERE p.id = $1`,
      [req.params.id]
    );
    const project = projectResult.rows[0];
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const investorStats = await pool.query(
      `SELECT COUNT(*)::int AS investor_count, COALESCE(SUM(amount), 0) AS total_invested
       FROM investments WHERE project_id = $1 AND status IN ('active','settled')`,
      [req.params.id]
    );

    const settlementRes = await pool.query(
      `SELECT ys.*, reviewer.name AS reviewer_name
       FROM yield_settlements ys
       LEFT JOIN users reviewer ON reviewer.id = ys.reviewed_by
       WHERE ys.project_id = $1`,
      [req.params.id]
    );

    return res.json({
      ...project,
      ...investorStats.rows[0],
      settlement_audit: settlementRes.rows[0] || null,
    });
  } catch (err) {
    console.error('Error fetching project detail:', err);
    return res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects  (FPO only) - list a new crop project
router.post('/', requireAuth, requireRole('fpo'), validateCreateProject, async (req, res) => {
  const {
    crop_name, title, description, region,
    target_amount, min_investment, expected_return_pct,
    duration_days, funding_deadline,
  } = req.body;

  try {
    const fpoResult = await pool.query('SELECT id FROM fpo_profiles WHERE user_id = $1', [req.user.id]);
    const fpoProfile = fpoResult.rows[0];
    if (!fpoProfile) {
      return res.status(400).json({ error: 'No FPO profile found for this account' });
    }

    const result = await pool.query(
      `INSERT INTO projects
        (fpo_id, crop_name, title, description, region, target_amount, min_investment,
         expected_return_pct, duration_days, funding_deadline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        fpoProfile.id, crop_name, title, description || null, region || null,
        target_amount, min_investment || 500, expected_return_pct || 0,
        duration_days || 120, funding_deadline || null,
      ]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating project:', err);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/projects/mine/fpo  (FPO's own projects)
router.get('/mine/fpo', requireAuth, requireRole('fpo'), async (req, res) => {
  try {
    const fpoResult = await pool.query('SELECT id FROM fpo_profiles WHERE user_id = $1', [req.user.id]);
    const fpoProfile = fpoResult.rows[0];
    if (!fpoProfile) return res.json([]);

    const result = await pool.query(
      `SELECT p.*, ys.status AS settlement_status, ys.notes AS settlement_notes, ys.rejection_reason
       FROM projects p
       LEFT JOIN yield_settlements ys ON ys.project_id = p.id
       WHERE p.fpo_id = $1
       ORDER BY p.created_at DESC`,
      [fpoProfile.id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching FPO projects:', err);
    return res.status(500).json({ error: 'Failed to fetch your projects' });
  }
});

// POST /api/projects/:id/settle & /request-settlement (FPO submits harvest sale proposal for Third-Party Admin review)
const handleSettlementSubmission = async (req, res) => {
  const { total_yield_value, notes, proof_docs } = req.body;
  const projectId = req.params.id;

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const projectResult = await client.query(
      `SELECT p.*, f.user_id AS fpo_user_id FROM projects p
       JOIN fpo_profiles f ON f.id = p.fpo_id WHERE p.id = $1 FOR UPDATE`,
      [projectId]
    );
    const project = projectResult.rows[0];
    if (!project) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.fpo_user_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'You do not own this project' });
    }
    if (['settled', 'cancelled', 'settlement_pending'].includes(project.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Project status is already '${project.status}'` });
    }

    const feePct = 5;
    const feeAmt = Number(total_yield_value) * (feePct / 100);
    const distributable = Number(total_yield_value) - feeAmt;

    // Insert or update yield_settlements record in 'pending' state
    await client.query(
      `INSERT INTO yield_settlements
        (project_id, total_yield_value, fpo_yield_value, platform_fee_pct, platform_fee_amt, distributable_amt, status, notes, proof_docs)
       VALUES ($1, $2, $2, $3, $4, $5, 'pending', $6, $7)
       ON CONFLICT (project_id) DO UPDATE SET
        total_yield_value = EXCLUDED.total_yield_value,
        fpo_yield_value = EXCLUDED.fpo_yield_value,
        platform_fee_amt = EXCLUDED.platform_fee_amt,
        distributable_amt = EXCLUDED.distributable_amt,
        status = 'pending',
        notes = EXCLUDED.notes,
        proof_docs = EXCLUDED.proof_docs,
        rejection_reason = NULL,
        settled_at = now()`,
      [projectId, total_yield_value, feePct, feeAmt, distributable, notes || null, proof_docs || 'FPO Self-Attestation & Sales Voucher']
    );

    // Transition project status to settlement_pending
    await client.query("UPDATE projects SET status = 'settlement_pending' WHERE id = $1", [projectId]);

    await client.query('COMMIT');
    return res.json({
      message: 'Harvest sale proposal submitted successfully. Pending Third-Party Platform Admin / Auditor verification.',
      project_status: 'settlement_pending',
      proposed_sale_value: total_yield_value,
    });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {
        console.error('Rollback error:', rbErr);
      }
    }
    console.error('Settlement submission error:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit settlement proposal' });
  } finally {
    if (client) client.release();
  }
};

router.post('/:id/settle', requireAuth, requireRole('fpo'), validateSettlementRequest, handleSettlementSubmission);
router.post('/:id/request-settlement', requireAuth, requireRole('fpo'), validateSettlementRequest, handleSettlementSubmission);

module.exports = router;
