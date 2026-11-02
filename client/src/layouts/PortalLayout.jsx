import { DEMO_MODE, resetDemo } from '../api/http';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PortalLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <h2>Office Simulator</h2>
        {user ? (
          <div>
            <span>{user.name} ({user.role})</span>
            <button onClick={logout} className="btn">Logout</button>
          </div>
        ) : <Link to="/login">Login</Link>}
      </header>
      <nav className="nav">
        <Link to="/">Home</Link>
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        {user?.role === 'teacher' && <Link to="/teacher">Teacher</Link>}
        {user?.role === 'student' && <Link to="/student">Student</Link>}
      </nav>
      <main className="main">
        {DEMO_MODE && <aside className="panel" role="note">
          <strong>Free browser demo</strong>
          <p>Sample data is saved only in this browser. It is not shared with other people or devices. This is not a secure live exam system.</p>
          <button className="btn" onClick={() => { if (window.confirm('Reset all demo data in this browser?')) { resetDemo(); logout(); window.location.hash = '/login'; window.location.reload(); } }}>Reset demo data</button>
        </aside>}
        <Outlet />
      </main>
    </div>
  );
}

