import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function formatErrorMessage(err) {
  const data = err.response?.data?.error;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') return data.message || data.msg || 'Authentication failed';
  return err.message || 'Invalid email or password';
}

export default function Login() {
  const { login, register } = useAuth();
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
      redirectUser(user);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (user) => {
    if (user.role === 'admin') {
      navigate('/admin');
    } else if (user.role === 'fpo') {
      navigate('/my-projects');
    } else {
      navigate('/');
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword, role = null, fpoName = null) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    try {
      // Attempt login first
      const user = await login(demoEmail, demoPassword);
      redirectUser(user);
    } catch (err) {
      // If demo account doesn't exist yet, auto-create it!
      if (role) {
        try {
          const newUser = await register({
            name: role === 'fpo' ? 'Demo Nashik Farmers Co-op' : 'Demo Urban Investor',
            email: demoEmail,
            password: demoPassword,
            role,
            fpo_name: fpoName || 'Nashik Grape Farmers',
            region: 'Nashik, MH',
          });
          redirectUser(newUser);
          return;
        } catch (regErr) {
          setError(formatErrorMessage(regErr));
        }
      } else {
        setError(formatErrorMessage(err));
      }
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

        {error && (
          <div className="error-text" style={{ padding: '10px 14px', background: '#fbe4e2', borderRadius: '8px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

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
          <label style={{ color: 'var(--green-dark)', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
            ⚡ 1-Click Instant Demo Access (Select Any Role):
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

            <button
              type="button"
              onClick={() => handleQuickLogin('fpo_demo@krishishare.com', 'password123', 'fpo', 'Nashik Farmers Co-op')}
              className="btn secondary"
              style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>🌾 <strong>FPO Producer Account</strong></span>
              <span className="badge" style={{ background: '#256d3b' }}>FPO</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('investor_demo@krishishare.com', 'password123', 'investor')}
              className="btn secondary"
              style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>💰 <strong>Urban Investor Account (₹5L Balance)</strong></span>
              <span className="badge" style={{ background: '#2b3f8c' }}>Investor</span>
            </button>
          </div>
        </div>

        <p className="muted" style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
          Don't have an account yet? <Link to="/register" style={{ fontWeight: 'bold' }}>Register custom FPO or Investor account</Link>
        </p>
      </div>
    </div>
  );
}
