import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function MyInvestments() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/investments/mine')
      .then((res) => setInvestments(res.data))
      .catch((err) => {
        console.error(err);
        setError('Failed to load portfolio investments.');
      })
      .finally(() => setLoading(false));
  }, []);

  const totalInvested = investments.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPayout = investments
    .filter((i) => i.status === 'settled')
    .reduce((sum, i) => sum + Number(i.payout_amount || 0), 0);

  if (loading) return <div className="container"><p className="muted">Loading your investment portfolio…</p></div>;
  if (error) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', borderTop: '4px solid var(--green)' }}>
          <h2 style={{ color: 'var(--green-dark)', marginTop: 0 }}>💰 Investor Account Required</h2>
          <p className="muted">The portfolio dashboard is reserved for Investor accounts.</p>
          <button
            className="btn"
            style={{ marginTop: '16px' }}
            onClick={async () => {
              try {
                const res = await api.post('/auth/login', { email: 'investor_demo@krishishare.com', password: 'password123' });
                localStorage.setItem('krishishare_token', res.data.token);
                localStorage.setItem('krishishare_user', JSON.stringify(res.data.user));
                window.location.reload();
              } catch (e) {
                console.error(e);
              }
            }}
          >
            ⚡ Click Here to Switch to Demo Investor Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>💰 My Investment Portfolio</h2>
        <Link to="/" className="btn secondary">🌾 Browse Open Projects</Link>
      </div>

      <div className="stat-row">
        <div className="stat-box">
          <div className="label">Total Capital Invested</div>
          <div className="value">₹{totalInvested.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-box" style={{ background: 'var(--green-light)' }}>
          <div className="label">Total Payouts Received</div>
          <div className="value" style={{ color: 'var(--green-dark)' }}>₹{totalPayout.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-box">
          <div className="label">Active Positions</div>
          <div className="value">{investments.filter((i) => i.status === 'active').length}</div>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            No investments yet. <Link to="/" style={{ fontWeight: 'bold' }}>Explore live crop projects</Link> to start funding FPOs.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Project Title</th>
                <th>FPO Producer</th>
                <th>Invested Amount</th>
                <th>Status</th>
                <th>Return Payout</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((i) => (
                <tr key={i.id}>
                  <td><Link to={`/projects/${i.project_id}`} style={{ fontWeight: 'bold' }}>{i.title}</Link></td>
                  <td>{i.fpo_name}</td>
                  <td style={{ fontWeight: 'bold' }}>₹{Number(i.amount).toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`status-pill status-${i.status}`}>{i.status}</span>
                  </td>
                  <td style={{ fontWeight: 'bold', color: i.payout_amount ? 'var(--green-dark)' : 'inherit' }}>
                    {i.payout_amount ? `₹${Number(i.payout_amount).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td>{new Date(i.invested_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
