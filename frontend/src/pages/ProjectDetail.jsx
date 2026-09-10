import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import CropHealthGauge from '../components/CropHealthGauge';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [investing, setInvesting] = useState(false);

  const load = () => {
    api.get(`/projects/${id}`).then((res) => setProject(res.data));
  };

  useEffect(load, [id]);

  const handleInvest = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setInvesting(true);
    try {
      const res = await api.post('/investments', { project_id: Number(id), amount: Number(amount) });
      setMessage(`Investment successful. Project status: ${res.data.project_status}.`);
      setAmount('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Investment failed');
    } finally {
      setInvesting(false);
    }
  };

  if (!project) return <div className="container"><p className="muted">Loading project details…</p></div>;

  const pct = Math.min(100, (Number(project.raised_amount) / Number(project.target_amount)) * 100);
  const remaining = Number(project.target_amount) - Number(project.raised_amount);

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ margin: 0 }}>{project.title}</h2>
          <span className={`status-pill status-${project.status}`}>
            {project.status === 'settlement_pending' ? 'Pending Third-Party Audit' : project.status.replace('_', ' ')}
          </span>
        </div>
        <p className="muted">{project.crop_name} · Listed by {project.fpo_name} · {project.region || project.fpo_region}</p>
        <p>{project.description}</p>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="muted">
          ₹{Number(project.raised_amount).toLocaleString('en-IN')} raised of ₹{Number(project.target_amount).toLocaleString('en-IN')}
          {' '}({pct.toFixed(0)}%) · {project.investor_count} investor(s)
        </p>

        <div className="stat-row">
          <div className="stat-box">
            <div className="label">Expected Return</div>
            <div className="value">{project.expected_return_pct}%</div>
          </div>
          <div className="stat-box">
            <div className="label">Duration</div>
            <div className="value">{project.duration_days} days</div>
          </div>
          <div className="stat-box">
            <div className="label">Min. Investment</div>
            <div className="value">₹{Number(project.min_investment).toLocaleString('en-IN')}</div>
          </div>
        </div>

        {project.status === 'settlement_pending' && (
          <div style={{ background: '#fff8e1', border: '1px solid #f0d97a', padding: '12px 16px', borderRadius: '8px', marginTop: '16px' }}>
            <strong style={{ color: '#8a6d00' }}>⏳ Harvest Settlement Audit in Progress</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#6b5900' }}>
              The FPO has submitted harvest sales figures. A third-party platform admin / auditor is reviewing sales invoices before distributing yield payouts to investors.
            </p>
          </div>
        )}

        {project.status === 'settled' && project.settlement_audit && (
          <div style={{ background: '#e0e7f7', border: '1px solid #b3c2f2', padding: '12px 16px', borderRadius: '8px', marginTop: '16px' }}>
            <strong style={{ color: '#2b3f8c' }}>✅ Third-Party Audited Settlement Complete</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#1a2656' }}>
              Confirmed Harvest Sale Value: <strong>₹{Number(project.settlement_audit.total_yield_value).toLocaleString('en-IN')}</strong> · Platform Fee: {project.settlement_audit.platform_fee_pct}% · Verified by Auditor {project.settlement_audit.reviewer_name || 'Admin'}
            </p>
          </div>
        )}
      </div>

      {/* Satellite & Weather Telemetry Visual Widget */}
      <CropHealthGauge projectId={id} />

      {user?.role === 'investor' && project.status === 'open' && (
        <div className="card">
          <h3>Fund this project</h3>
          <p className="muted">Simulated wallet debit only — no real payment is made.</p>
          {error && <div className="error-text">{error}</div>}
          {message && <p style={{ color: 'var(--green-dark)', fontWeight: 600 }}>{message}</p>}
          <form onSubmit={handleInvest}>
            <label>Amount (₹) — min ₹{Number(project.min_investment).toLocaleString('en-IN')}, up to ₹{remaining.toLocaleString('en-IN')} remaining</label>
            <input
              type="number"
              min={project.min_investment}
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <button className="btn" type="submit" disabled={investing}>
              {investing ? 'Processing…' : 'Invest now'}
            </button>
          </form>
        </div>
      )}

      {!user && (
        <p className="muted">Log in as an investor to fund this project.</p>
      )}
    </div>
  );
}
