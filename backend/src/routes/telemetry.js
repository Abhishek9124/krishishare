const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// Helper to determine status label from crop health index
function getHealthStatus(index) {
  if (index >= 80) return 'Optimal';
  if (index >= 65) return 'Good';
  if (index >= 50) return 'Moderate Risk';
  return 'High Risk';
}

// GET /api/projects/:id/telemetry
// Returns latest reading and telemetry history. Generates baseline data if empty.
router.get('/projects/:id/telemetry', async (req, res) => {
  const projectId = req.params.id;
  try {
    const projectRes = await pool.query('SELECT id, crop_name, title FROM projects WHERE id = $1', [projectId]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    let historyRes = await pool.query(
      'SELECT * FROM project_telemetry WHERE project_id = $1 ORDER BY recorded_at ASC',
      [projectId]
    );

    // Auto-seed initial baseline telemetry if none exists
    if (historyRes.rows.length === 0) {
      const initialIndex = 82 + Math.random() * 10;
      const initialNdvi = 0.70 + Math.random() * 0.15;
      const temp = 26 + Math.random() * 6;
      const rain = 8 + Math.random() * 15;
      const moisture = 40 + Math.random() * 20;
      const status = getHealthStatus(initialIndex);

      await pool.query(
        `INSERT INTO project_telemetry
          (project_id, crop_health_index, ndvi_score, temperature_c, rainfall_mm, soil_moisture_pct, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          projectId,
          initialIndex.toFixed(2),
          initialNdvi.toFixed(3),
          temp.toFixed(1),
          rain.toFixed(1),
          moisture.toFixed(1),
          status,
          'Initial Baseline Satellite Scan',
        ]
      );

      historyRes = await pool.query(
        'SELECT * FROM project_telemetry WHERE project_id = $1 ORDER BY recorded_at ASC',
        [projectId]
      );
    }

    const latest = historyRes.rows[historyRes.rows.length - 1];
    return res.json({
      latest,
      history: historyRes.rows,
    });
  } catch (err) {
    console.error('Telemetry fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch telemetry data' });
  }
});

// POST /api/projects/:id/telemetry/perturb
// Simulates a mock satellite scan / weather perturbation
router.get('/projects/:id/telemetry/perturb', async (req, res) => {
  // Allow GET or POST for easy testing / UI trigger
  return handlePerturb(req, res);
});

router.post('/projects/:id/telemetry/perturb', async (req, res) => {
  return handlePerturb(req, res);
});

async function handlePerturb(req, res) {
  const projectId = req.params.id;
  try {
    const projectRes = await pool.query('SELECT id FROM projects WHERE id = $1', [projectId]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const latestRes = await pool.query(
      'SELECT * FROM project_telemetry WHERE project_id = $1 ORDER BY recorded_at DESC LIMIT 1',
      [projectId]
    );

    const prev = latestRes.rows[0] || {
      crop_health_index: 85,
      ndvi_score: 0.75,
      temperature_c: 28.5,
      rainfall_mm: 12.0,
      soil_moisture_pct: 45.0,
    };

    // Perturb within realistic ranges
    const indexDelta = (Math.random() * 8) - 3.8; // -3.8 to +4.2
    const newIndex = Math.min(100, Math.max(20, Number(prev.crop_health_index) + indexDelta));
    const newNdvi = Math.min(0.95, Math.max(0.1, Number(prev.ndvi_score) + (indexDelta * 0.005)));
    const newTemp = Math.min(45, Math.max(15, Number(prev.temperature_c) + (Math.random() * 3 - 1.5)));
    const newRain = Math.max(0, Number(prev.rainfall_mm) + (Math.random() * 6 - 2.5));
    const newMoisture = Math.min(90, Math.max(10, Number(prev.soil_moisture_pct) + (Math.random() * 6 - 3)));
    const status = getHealthStatus(newIndex);

    const notesList = [
      'Satellite Pass: Normal vegetative index',
      'Weather alert: Moderate rainfall observed',
      'Thermal band update: Optimal canopy temperature',
      'Sentinel-2 multispectral imagery sync',
      'Radar soil moisture calibration scan',
    ];
    const note = notesList[Math.floor(Math.random() * notesList.length)];

    const result = await pool.query(
      `INSERT INTO project_telemetry
        (project_id, crop_health_index, ndvi_score, temperature_c, rainfall_mm, soil_moisture_pct, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        projectId,
        newIndex.toFixed(2),
        newNdvi.toFixed(3),
        newTemp.toFixed(1),
        newRain.toFixed(1),
        newMoisture.toFixed(1),
        status,
        note,
      ]
    );

    const historyRes = await pool.query(
      'SELECT * FROM project_telemetry WHERE project_id = $1 ORDER BY recorded_at ASC',
      [projectId]
    );

    return res.json({
      latest: result.rows[0],
      history: historyRes.rows,
      message: 'Simulated satellite pass completed successfully',
    });
  } catch (err) {
    console.error('Telemetry perturbation error:', err);
    return res.status(500).json({ error: 'Failed to perturb telemetry data' });
  }
}

module.exports = router;
