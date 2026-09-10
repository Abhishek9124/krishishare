import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function CreateProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    crop_name: '', title: '', description: '', region: '',
    target_amount: '', min_investment: 500, expected_return_pct: 10,
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
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container form-wrap">
      <div className="card">
        <h2>List a new crop project</h2>
        {error && <div className="error-text">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Crop name</label>
          <input value={form.crop_name} onChange={update('crop_name')} required placeholder="e.g. Kharif Soybean" />

          <label>Project title</label>
          <input value={form.title} onChange={update('title')} required placeholder="e.g. 40-acre Soybean Cluster, Nashik Belt" />

          <label>Description</label>
          <textarea rows={4} value={form.description} onChange={update('description')} placeholder="Crop plan, input requirements, labor budget…" />

          <label>Region</label>
          <input value={form.region} onChange={update('region')} placeholder="e.g. Nashik, Maharashtra" />

          <label>Target funding amount (₹)</label>
          <input type="number" min="1" value={form.target_amount} onChange={update('target_amount')} required />

          <label>Minimum investment (₹)</label>
          <input type="number" min="1" value={form.min_investment} onChange={update('min_investment')} />

          <label>Expected return (%)</label>
          <input type="number" step="0.1" value={form.expected_return_pct} onChange={update('expected_return_pct')} />

          <label>Duration (days to harvest)</label>
          <input type="number" min="1" value={form.duration_days} onChange={update('duration_days')} />

          <label>Funding deadline (optional)</label>
          <input type="date" value={form.funding_deadline} onChange={update('funding_deadline')} />

          <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Publishing…' : 'Publish project'}
          </button>
        </form>
      </div>
    </div>
  );
}
