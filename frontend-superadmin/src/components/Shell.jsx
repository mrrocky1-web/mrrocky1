import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/restaurants', label: 'Restaurants' },
  { to: '/customers', label: 'Customers' },
  { to: '/tickets', label: 'Support tickets' },
  { to: '/settings', label: 'Platform settings' },
  { to: '/audit-log', label: 'Audit log' },
];

export default function Shell({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">SUPER ADMIN</div>
        <div className="sidebar-sub">Platform control panel</div>
        <nav>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div>{user?.email}</div>
          <button onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
