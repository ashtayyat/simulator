import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PortalLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <h2>Office Simulator</h2>
        <div>
          <span>{user?.name} ({user?.role})</span>
          <button onClick={logout} className="btn">Logout</button>
        </div>
      </header>
      <nav className="nav">
        <Link to="/">Home</Link>
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        {user?.role === 'teacher' && <Link to="/teacher">Teacher</Link>}
        {user?.role === 'student' && <Link to="/student">Student</Link>}
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
