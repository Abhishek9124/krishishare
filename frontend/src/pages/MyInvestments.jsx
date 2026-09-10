import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function MyInvestments() {
  const [investments, setInvestments] = useState([]);

  useEffect(() => {
    api.get('/investments/mine').then((res) => setInvestments(res.data));
  }, []);

  const totalInvested = investments.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPayout = investments
    .filter((i) => i.status === 'settled')
    .reduce((sum, i) => sum + Number(i.payout_amount || 0), 0);

  return (
    <div className="container">
      <h2>My Investments</h2>

      <div className="stat-row">
        <div className="stat-box">
          <div className="label">Total Invested</div>
          <div className="value">₹{totalInvested.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-box">
          <div className="label">Total Payouts Received</div>
          <div className="value">₹{totalPayout.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-box">
          <div className="label">Active Positions</div>
          <div className="value">{investments.filter((i) => i.status === 'active').length}</div>
        </div>
      </div>

      {investments.length === 0 ? (
        <p className="muted">No investments yet. <Link to="/">Browse open projects</Link>.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>FPO</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payout</th>
              <th>Invested On</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((i) => (
              <tr key={i.id}>
                <td><Link to={`/projects/${i.project_id}`}>{i.title}</Link></td>
                <td>{i.fpo_name}</td>
                <td>₹{Number(i.amount).toLocaleString('en-IN')}</td>
                <td><span className={`status-pill status-${i.status}`}>{i.status}</span></td>
                <td>{i.payout_amount ? `₹${Number(i.payout_amount).toLocaleString('en-IN')}` : '—'}</td>
                <td>{new Date(i.invested_at).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
