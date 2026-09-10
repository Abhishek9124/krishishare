import { useState, useEffect } from 'react';
import api from '../api';

export default function CropHealthGauge({ projectId }) {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState('');

  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/projects/${projectId}/telemetry`);
      setTelemetry(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load satellite telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchTelemetry();
    }
  }, [projectId]);

  const handleSimulatePass = async () => {
    try {
      setSimulating(true);
      const { data } = await api.post(`/projects/${projectId}/telemetry/perturb`);
      setTelemetry(data);
    } catch (err) {
      console.error(err);
      setError('Failed to run satellite scan simulation.');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) return <div className="muted" style={{ padding: '16px 0' }}>Loading satellite telemetry...</div>;
  if (error) return <div className="error-text">{error}</div>;
  if (!telemetry || !telemetry.latest) return null;

  const latest = telemetry.latest;
  const healthIndex = Number(latest.crop_health_index);

  let statusColor = '#256d3b'; // green
  let statusBg = '#e8f3ec';
  if (healthIndex < 65 && healthIndex >= 50) {
    statusColor = '#b8860b'; // yellow/amber
    statusBg = '#fff8e1';
  } else if (healthIndex < 50) {
    statusColor = '#b3261e'; // red
    statusBg = '#fbe4e2';
  }

  return (
    <div className="card" style={{ borderLeft: `6px solid ${statusColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🛰️ Parametric Satellite & Weather Shield
          </h3>
          <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
            Real-time multispectral NDVI & weather risk assessment engine
          </p>
        </div>

        <button
          onClick={handleSimulatePass}
          disabled={simulating}
          className="btn secondary"
          style={{ padding: '6px 14px', fontSize: '0.85rem' }}
        >
          {simulating ? 'Scanning Satellite...' : '⚡ Simulate Satellite Pass'}
        </button>
      </div>

      <div className="stat-row" style={{ marginTop: '20px' }}>
        <div className="stat-box" style={{ background: statusBg, flex: '1 1 180px' }}>
          <div className="label">Crop Health Index</div>
          <div className="value" style={{ color: statusColor, fontSize: '1.8rem' }}>
            {healthIndex.toFixed(1)} <span style={{ fontSize: '1rem' }}>/ 100</span>
          </div>
          <div style={{ marginTop: '4px' }}>
            <span
              style={{
                background: statusColor,
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}
            >
              {latest.status}
            </span>
          </div>
        </div>

        <div className="stat-box" style={{ flex: '1 1 120px' }}>
          <div className="label">NDVI Index</div>
          <div className="value">{Number(latest.ndvi_score).toFixed(3)}</div>
          <div className="muted" style={{ fontSize: '0.75rem' }}>Vegetation Density</div>
        </div>

        <div className="stat-box" style={{ flex: '1 1 120px' }}>
          <div className="label">Canopy Temp</div>
          <div className="value">{latest.temperature_c}°C</div>
          <div className="muted" style={{ fontSize: '0.75rem' }}>Thermal Infra</div>
        </div>

        <div className="stat-box" style={{ flex: '1 1 120px' }}>
          <div className="label">Precipitation</div>
          <div className="value">{latest.rainfall_mm} mm</div>
          <div className="muted" style={{ fontSize: '0.75rem' }}>Soil Moisture: {latest.soil_moisture_pct}%</div>
        </div>
      </div>

      {healthIndex < 60 && (
        <div style={{ background: '#fff8e1', border: '1px solid #f0d97a', padding: '10px 14px', borderRadius: '8px', margin: '14px 0 6px 0' }}>
          <strong style={{ color: '#8a6d00' }}>⚡ Parametric Weather Shield Warning Triggered</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#6b5900' }}>
            Vegetative stress index detected below threshold ({healthIndex.toFixed(1)}). Parametric weather insurance monitoring is active to protect crop yield advances.
          </p>
        </div>
      )}

      {/* Progress Bar representation of crop health index */}
      <div style={{ margin: '16px 0 8px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)' }}>
          <span>Vegetative Stress</span>
          <span>Optimal Growth Range</span>
        </div>
        <div className="progress-track" style={{ height: '8px' }}>
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(100, healthIndex)}%`,
              backgroundColor: statusColor,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {telemetry.history && telemetry.history.length > 1 && (
        <details style={{ marginTop: '16px', fontSize: '0.85rem' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--green)', fontWeight: '600' }}>
            View Telemetry Scan Log ({telemetry.history.length} satellite passes)
          </summary>
          <div style={{ maxHeight: '180px', overflowY: 'auto', marginTop: '8px' }}>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Health Index</th>
                  <th>NDVI</th>
                  <th>Temp</th>
                  <th>Status & Scan Notes</th>
                </tr>
              </thead>
              <tbody>
                {[...telemetry.history].reverse().map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                    <td style={{ fontWeight: 'bold' }}>{Number(row.crop_health_index).toFixed(1)}</td>
                    <td>{Number(row.ndvi_score).toFixed(3)}</td>
                    <td>{row.temperature_c}°C</td>
                    <td>{row.status} ({row.notes})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
