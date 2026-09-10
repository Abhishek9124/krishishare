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
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container form-wrap">
      <div className="card">
        <h2>Log in</h2>
        {error && <div className="error-text">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 14 }}>
          No account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
