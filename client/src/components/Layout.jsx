import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">Team Tasks</div>
        <nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/projects">Projects</NavLink>
        </nav>
        <div className="sidebar-user">
          <div>{user?.name}</div>
          <div style={{ fontSize: '0.8rem' }}>{user?.email}</div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '0.75rem', width: '100%' }}
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
