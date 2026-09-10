import { useEffect, useState } from 'react';
import api from '../api';

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [settleForm, setSettleForm] = useState({}); // { [projectId]: { total_yield_value, notes, proof_docs } }
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState({});

  const load = () => {
    api.get('/projects/mine/fpo').then((res) => setProjects(res.data));
  };

  useEffect(load, []);

  const updateField = (id, key, value) => {
    setSettleForm((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };

  const handleSettleSubmit = async (id) => {
    const values = settleForm[id] || {};
    if (!values.total_yield_value || Number(values.total_yield_value) <= 0) {
      setFeedback((f) => ({ ...f, [id]: { error: 'Please enter a valid total sale value of the harvested yield.' } }));
      return;
    }
    setBusyId(id);
    setFeedback((f) => ({ ...f, [id]: null }));
    try {
      const res = await api.post(`/projects/${id}/settle`, {
        total_yield_value: Number(values.total_yield_value),
        notes: values.notes || 'Harvest yield sold in local mandi market.',
        proof_docs: values.proof_docs || 'FPO Market Invoice & Sales Voucher #2026-FPO',
      });
      setFeedback((f) => ({
        ...f,
        [id]: { success: res.data.message || 'Submitted for Third-Party Audit verification.' },
      }));
      load();
    } catch (err) {
      setFeedback((f) => ({ ...f, [id]: { error: err.response?.data?.error || 'Submission failed' } }));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container">
      <h2>My Listed FPO Projects</h2>
      {projects.length === 0 && <p className="muted">You haven't listed any projects yet.</p>}

      {projects.map((p) => {
        const pct = Math.min(100, (Number(p.raised_amount) / Number(p.target_amount)) * 100);
        const canSubmitSettlement = ['funded', 'in_progress', 'harvested'].includes(p.status);
        const fb = feedback[p.id];

        return (
          <div className="card" key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0 }}>{p.title}</h3>
              <span className={`status-pill status-${p.status}`}>
                {p.status === 'settlement_pending' ? 'Pending Third-Party Audit' : p.status.replace('_', ' ')}
              </span>
            </div>
            <p className="muted">{p.crop_name} · {p.region}</p>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
            <p className="muted">₹{Number(p.raised_amount).toLocaleString('en-IN')} / ₹{Number(p.target_amount).toLocaleString('en-IN')} raised</p>

            {p.rejection_reason && (
              <div style={{ background: '#fbe4e2', border: '1px solid #f2b8b3', padding: '10px 14px', borderRadius: '8px', margin: '12px 0' }}>
                <strong style={{ color: 'var(--danger)' }}>❌ Previous Settlement Request Rejected by Auditor:</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>{p.rejection_reason}</p>
              </div>
            )}

            {canSubmitSettlement && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--green-dark)' }}>Submit Harvest Sale for Third-Party Audit</h4>
                <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                  Provide total harvest sale revenue and invoice proof. The Platform Auditor will verify and release payouts to investors.
                </p>

                <label>Total Sale Value of Harvested Yield (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 600000"
                  value={settleForm[p.id]?.total_yield_value || ''}
                  onChange={(e) => updateField(p.id, 'total_yield_value', e.target.value)}
                />

                <label>Harvest Sales Notes & Mandi Market Details</label>
                <input
                  type="text"
                  placeholder="e.g. Sold 40 metric tons at APMC Mandi, Invoice #8841"
                  value={settleForm[p.id]?.notes || ''}
                  onChange={(e) => updateField(p.id, 'notes', e.target.value)}
                />

                <label>Sales Proof / Voucher Reference</label>
                <input
                  type="text"
                  placeholder="e.g. APMC Mandi Receipt #2026-FPO"
                  value={settleForm[p.id]?.proof_docs || ''}
                  onChange={(e) => updateField(p.id, 'proof_docs', e.target.value)}
                />

                {fb?.error && <div className="error-text">{fb.error}</div>}
                {fb?.success && <p style={{ color: 'var(--green-dark)', fontWeight: 600 }}>{fb.success}</p>}
                <button className="btn" disabled={busyId === p.id} onClick={() => handleSettleSubmit(p.id)}>
                  {busyId === p.id ? 'Submitting…' : '📤 Submit Harvest Sale for Audit Approval'}
                </button>
              </div>
            )}

            {p.status === 'settlement_pending' && (
              <div style={{ marginTop: 12, padding: '12px 16px', background: '#fff8e1', borderRadius: '8px', border: '1px solid #f0d97a' }}>
                <strong style={{ color: '#8a6d00' }}>⏳ Audit Pending</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#6b5900' }}>
                  Your harvest sale proposal is currently under review by the Platform Admin / Auditor. Investors will receive payouts once confirmed.
                </p>
              </div>
            )}

            {p.status === 'settled' && (
              <p className="muted" style={{ color: 'var(--green-dark)', fontWeight: '600' }}>
                ✅ Settlement confirmed and payouts distributed to investors.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
