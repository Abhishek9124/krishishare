import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickSwitch = async (email) => {
    try {
      await login(email, email === 'admin@krishishare.com' ? 'admin123' : 'password123');
      if (email === 'admin@krishishare.com') navigate('/admin');
      else navigate('/');
    } catch (e) {
      console.error('Quick switch error:', e);
    }
  };

  return (
    <div className="navbar">
      <Link to="/" className="brand">🌾 Krishishare</Link>
      <div className="links" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link to="/">Projects</Link>
        {user?.role === 'investor' && <Link to="/my-investments">My Investments</Link>}
        {user?.role === 'fpo' && <Link to="/create-project">List a Project</Link>}
        {user?.role === 'fpo' && <Link to="/my-projects">My Projects</Link>}
        {user?.role === 'admin' && <Link to="/admin">🛡️ Admin Audit</Link>}
        {user && <Link to="/wallet">Wallet</Link>}
        
        {user ? (
          <>
            <div style={{ display: 'inline-flex', gap: '0.35rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>
              <span style={{ opacity: 0.8, alignSelf: 'center', marginRight: '0.2rem' }}>Switch:</span>
              <button className="btn-sm" style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem', background: user.role === 'admin' ? 'var(--green-light)' : 'transparent', color: user.role === 'admin' ? '#0f291e' : '#fff' }} onClick={() => handleQuickSwitch('admin@krishishare.com')}>Admin</button>
              <button className="btn-sm" style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem', background: user.role === 'fpo' ? 'var(--green-light)' : 'transparent', color: user.role === 'fpo' ? '#0f291e' : '#fff' }} onClick={() => handleQuickSwitch('fpo_demo@krishishare.com')}>FPO</button>
              <button className="btn-sm" style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem', background: user.role === 'investor' ? 'var(--green-light)' : 'transparent', color: user.role === 'investor' ? '#0f291e' : '#fff' }} onClick={() => handleQuickSwitch('investor_demo@krishishare.com')}>Investor</button>
            </div>
            <button className="linklike" style={{ color: '#ffcdd2' }} onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  );
}
