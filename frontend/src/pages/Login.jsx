import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'fpo') {
        navigate('/my-projects');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    try {
      const user = await login(demoEmail, demoPassword);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'fpo') {
        navigate('/my-projects');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container form-wrap" style={{ maxWidth: '520px' }}>
      <div className="card" style={{ padding: '28px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.75rem', color: 'var(--green-dark)' }}>
            🌾 Welcome to Krishishare
          </h2>
          <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
            FPO-backed Contract Farming & Yield Settlement Marketplace
          </p>
        </div>

        {error && <div className="error-text" style={{ padding: '10px', background: '#fbe4e2', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="e.g. investor@krishishare.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn" type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
            {loading ? 'Logging in…' : 'Log in to Portal'}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <label style={{ color: 'var(--green-dark)', fontWeight: 'bold', marginBottom: '10px' }}>
            ⚡ Quick Demo Accounts (One-Click Auto Login):
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@krishishare.com', 'admin123')}
              className="btn secondary"
              style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>🛡️ <strong>Platform Admin / Auditor</strong></span>
              <span className="badge" style={{ background: '#b3261e' }}>Admin</span>
            </button>
          </div>
        </div>

        <p className="muted" style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
          Don't have an account yet? <Link to="/register" style={{ fontWeight: 'bold' }}>Register a new FPO or Investor account</Link>
        </p>
      </div>
    </div>
  );
}
