import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'investor',
    fpo_name: '', registration_number: '', region: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container form-wrap">
      <div className="card">
        <h2>Create an account</h2>
        <div className="disclaimer">
          Demo build: all funds are simulated. Investor accounts get a virtual starting balance —
          no real money or bank connection is involved.
        </div>
        {error && <div className="error-text">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>I am a</label>
          <select value={form.role} onChange={update('role')}>
            <option value="investor">Urban Investor</option>
            <option value="fpo">FPO (Farmer Producer Organization)</option>
          </select>

          <label>Full name</label>
          <input value={form.name} onChange={update('name')} required />

          <label>Email</label>
          <input type="email" value={form.email} onChange={update('email')} required />

          <label>Password</label>
          <input type="password" value={form.password} onChange={update('password')} required minLength={6} />

          {form.role === 'fpo' && (
            <>
              <label>FPO registered name</label>
              <input value={form.fpo_name} onChange={update('fpo_name')} required />

              <label>Registration number (optional)</label>
              <input value={form.registration_number} onChange={update('registration_number')} />

              <label>Region</label>
              <input value={form.region} onChange={update('region')} placeholder="e.g. Nashik, Maharashtra" />
            </>
          )}

          <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 14 }}>
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
