import { useEffect, useState } from 'react';
import api from '../api';

export default function Wallet() {
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    api.get('/wallet').then((res) => setWallet(res.data));
  }, []);

  if (!wallet) return <div className="container"><p className="muted">Loading…</p></div>;

  return (
    <div className="container">
      <h2>My Wallet</h2>
      <div className="disclaimer">Simulated wallet — reflects demo balances only, not a real bank or escrow account.</div>

      <div className="stat-box" style={{ marginBottom: 20 }}>
        <div className="label">Current Balance</div>
        <div className="value">₹{Number(wallet.balance).toLocaleString('en-IN')}</div>
      </div>

      <h3>Transaction history</h3>
      {wallet.transactions.length === 0 ? (
        <p className="muted">No transactions yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Date</th><th>Type</th><th>Amount</th><th>Description</th></tr>
          </thead>
          <tbody>
            {wallet.transactions.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.created_at).toLocaleString('en-IN')}</td>
                <td style={{ textTransform: 'capitalize', color: t.type === 'credit' ? 'var(--green-dark)' : 'var(--danger)' }}>{t.type}</td>
                <td>₹{Number(t.amount).toLocaleString('en-IN')}</td>
                <td className="muted">{t.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
