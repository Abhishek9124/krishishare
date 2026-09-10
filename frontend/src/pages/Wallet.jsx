import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Wallet() {
  const { login } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWallet = () => {
    setLoading(true);
    setError('');
    api.get('/wallet')
      .then((res) => setWallet(res.data))
      .catch((err) => {
        console.error(err);
        setError('Failed to load wallet balance.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  if (loading) return <div className="container"><p className="muted">Loading wallet details…</p></div>;
  if (error) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', borderTop: '4px solid var(--green)' }}>
          <h2 style={{ color: 'var(--green-dark)', marginTop: 0 }}>💳 Login Required</h2>
          <p className="muted">{error}</p>
          <button
            className="btn"
            style={{ marginTop: '16px' }}
            onClick={async () => {
              try {
                await login('investor_demo@krishishare.com', 'password123');
                fetchWallet();
              } catch (e) {
                console.error(e);
              }
            }}
          >
            ⚡ Click Here to Instant Login as Demo Investor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>💳 My Wallet</h2>
        <button onClick={fetchWallet} className="btn secondary">🔄 Refresh Balance</button>
      </div>

      <div className="disclaimer">
        Simulated virtual wallet — reflects demo balances only. No real money or bank accounts are connected.
      </div>

      <div className="stat-box" style={{ marginBottom: 24, background: 'var(--green-light)', padding: '20px' }}>
        <div className="label">Current Available Balance</div>
        <div className="value" style={{ fontSize: '2.2rem', color: 'var(--green-dark)' }}>
          ₹{Number(wallet.balance).toLocaleString('en-IN')}
        </div>
      </div>

      <h3>Ledger Transaction History</h3>
      {wallet.transactions.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>No transaction activity yet.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr><th>Date & Time</th><th>Type</th><th>Amount</th><th>Description</th></tr>
            </thead>
            <tbody>
              {wallet.transactions.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.created_at).toLocaleString('en-IN')}</td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        background: t.type === 'credit' ? '#e8f3ec' : '#fbe4e2',
                        color: t.type === 'credit' ? 'var(--green-dark)' : 'var(--danger)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold', color: t.type === 'credit' ? 'var(--green-dark)' : 'var(--danger)' }}>
                    {t.type === 'credit' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="muted">{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
