import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linksByRole = {
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/courses', label: 'Courses' },
    { to: '/admin/exams', label: 'Exams' },
    { to: '/admin/templates', label: 'Templates' },
    { to: '/admin/results', label: 'Results' }
  ],
  teacher: [
    { to: '/teacher', label: 'Dashboard' },
    { to: '/teacher/courses', label: 'My Courses' },
    { to: '/teacher/exams', label: 'Exams' },
    { to: '/teacher/templates', label: 'Templates' },
    { to: '/teacher/results', label: 'Results' }
  ],
  student: [
    { to: '/student', label: 'Dashboard' },
    { to: '/student/courses', label: 'My Courses' },
    { to: '/student/templates', label: 'Templates' },
    { to: '/student/results', label: 'Results' }
  ]
};

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const links = user ? linksByRole[user.role] : [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>Office Simulator</h2>
        <p>{user?.fullName}</p>
        <nav>
          {links.map((item) => (
            <Link key={item.to} to={item.to}>{item.label}</Link>
          ))}
        </nav>
        <button onClick={logout} className="danger">Logout</button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
