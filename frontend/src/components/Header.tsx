import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

export function Header() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">FinSmart {user?.email && `• ${user.email}`}</div>
        <nav className="nav">
          <NavLink to="/dashboard" className="nav-link">
            Dashboard
          </NavLink>
          <NavLink to="/transactions" className="nav-link">
            Transactions
          </NavLink>
          <NavLink to="/budgets" className="nav-link">
            Budgets
          </NavLink>
          <NavLink to="/categories" className="nav-link">
            Categories
          </NavLink>
        </nav>
        <div className="header-user">
          <button onClick={handleLogout} className="btn btn-secondary btn-small">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
