import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function formatErrorMessage(err) {
  const data = err.response?.data?.error;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') return data.message || data.msg || 'Failed to create project';
  return err.message || 'Failed to create project';
}

export default function CreateProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    crop_name: '', title: '', description: '', region: '',
    target_amount: '', min_investment: 500, expected_return_pct: 15,
    duration_days: 120, funding_deadline: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/projects', form);
      navigate(`/projects/${res.data.id}`);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container form-wrap" style={{ maxWidth: '600px' }}>
      <div className="card" style={{ padding: '28px' }}>
        <h2 style={{ marginTop: 0 }}>🌱 List a New Crop Project</h2>
        <p className="muted" style={{ marginBottom: '20px' }}>
          List a contract farming crop cycle for urban investors to fund.
        </p>

        {error && (
          <div className="error-text" style={{ padding: '10px 14px', background: '#fbe4e2', borderRadius: '8px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Crop Name</label>
          <input value={form.crop_name} onChange={update('crop_name')} required placeholder="e.g. Organic Export Grapes" />

          <label>Project Title</label>
          <input value={form.title} onChange={update('title')} required placeholder="e.g. 50-Acre Vineyard Harvest Cluster" />

          <label>Description & Farming Plan</label>
          <textarea rows={4} value={form.description} onChange={update('description')} placeholder="Detail crop inputs, drip irrigation, labor budget, and expected harvest timeline…" />

          <label>Farming Region / District</label>
          <input value={form.region} onChange={update('region')} placeholder="e.g. Nashik, Maharashtra" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label>Target Funding (₹)</label>
              <input type="number" min="1000" value={form.target_amount} onChange={update('target_amount')} required placeholder="100000" />
            </div>
            <div>
              <label>Min. Investment (₹)</label>
              <input type="number" min="100" value={form.min_investment} onChange={update('min_investment')} placeholder="1000" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label>Expected Return (%)</label>
              <input type="number" step="0.1" value={form.expected_return_pct} onChange={update('expected_return_pct')} placeholder="18" />
            </div>
            <div>
              <label>Duration (days)</label>
              <input type="number" min="30" value={form.duration_days} onChange={update('duration_days')} placeholder="120" />
            </div>
          </div>

          <button className="btn" type="submit" disabled={loading} style={{ width: '100%', marginTop: '16px', padding: '12px' }}>
            {loading ? 'Publishing project…' : '🚀 Publish Project to Marketplace'}
          </button>
        </form>
      </div>
    </div>
  );
}
