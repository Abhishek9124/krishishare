import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function formatErrorMessage(err) {
  const data = err.response?.data?.error;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') return data.message || data.msg || 'Registration failed';
  return err.message || 'Registration failed';
}

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
      const user = await register(form);
      if (user.role === 'fpo') {
        navigate('/my-projects');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container form-wrap" style={{ maxWidth: '520px' }}>
      <div className="card" style={{ padding: '28px' }}>
        <h2 style={{ marginTop: 0 }}>Create a Krishishare Account</h2>
        <div className="disclaimer" style={{ marginBottom: '20px' }}>
          Demo build: all funds are simulated. Investor accounts auto-receive a ₹5,00,000 demo wallet balance.
        </div>

        {error && (
          <div className="error-text" style={{ padding: '10px 14px', background: '#fbe4e2', borderRadius: '8px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Account Type / Role</label>
          <select value={form.role} onChange={update('role')}>
            <option value="investor">Urban Investor (Fund projects)</option>
            <option value="fpo">FPO (Farmer Producer Organization - List projects)</option>
          </select>

          <label>Full Name</label>
          <input value={form.name} onChange={update('name')} required placeholder="e.g. Ramesh Patil" />

          <label>Email Address</label>
          <input type="email" value={form.email} onChange={update('email')} required placeholder="name@example.com" />

          <label>Password (min 6 characters)</label>
          <input type="password" value={form.password} onChange={update('password')} required minLength={6} placeholder="••••••••" />

          {form.role === 'fpo' && (
            <>
              <label>FPO Registered Name</label>
              <input value={form.fpo_name} onChange={update('fpo_name')} required placeholder="e.g. Sahyadri Farmers Producer Co." />

              <label>Registration Number (optional)</label>
              <input value={form.registration_number} onChange={update('registration_number')} placeholder="REG-2026-MH-881" />

              <label>Region / District</label>
              <input value={form.region} onChange={update('region')} placeholder="e.g. Nashik, Maharashtra" />
            </>
          )}

          <button className="btn" type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
            {loading ? 'Creating account…' : 'Create Account & Access Portal'}
          </button>
        </form>

        <p className="muted" style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
          Already registered? <Link to="/login" style={{ fontWeight: 'bold' }}>Log in here</Link>
        </p>
      </div>
    </div>
  );
}
