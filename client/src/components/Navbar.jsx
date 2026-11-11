import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="app-container">
        <NavLink to="/" className="navbar-brand">
          <span>🩸</span> Sweety
        </NavLink>
        <div className="navbar-links">
          <NavLink to="/" end>Readings</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <span className="navbar-user">Hi, {user?.name?.split(' ')[0]}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

