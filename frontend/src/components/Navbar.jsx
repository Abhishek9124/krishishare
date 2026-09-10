import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="navbar">
      <Link to="/" className="brand">🌾 Krishishare</Link>
      <div className="links">
        <Link to="/">Projects</Link>
        {user?.role === 'investor' && <Link to="/my-investments">My Investments</Link>}
        {user?.role === 'fpo' && <Link to="/create-project">List a Project</Link>}
        {user?.role === 'fpo' && <Link to="/my-projects">My Projects</Link>}
        {user?.role === 'admin' && <Link to="/admin">🛡️ Admin Audit</Link>}
        {user && <Link to="/wallet">Wallet</Link>}
        {user ? (
          <>
            <span className="badge" style={{ background: user.role === 'admin' ? '#b3261e' : 'var(--green)' }}>
              {user.role}
            </span>
            <button className="linklike" onClick={handleLogout}>Logout</button>
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
