import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState({ users: 0, courses: 0, results: 0 });

  useEffect(() => {
    Promise.all([
      api('/users', { token }),
      api('/courses', { token }),
      api('/results', { token })
    ]).then(([users, courses, results]) => {
      setStats({ users: users.length, courses: courses.length, results: results.length });
    });
  }, [token]);

  return (
    <section>
      <h1>Admin Portal</h1>
      <div className="panel-grid">
        <article className="panel"><h3>Users</h3><p>{stats.users}</p></article>
        <article className="panel"><h3>Courses</h3><p>{stats.courses}</p></article>
        <article className="panel"><h3>Exam Results</h3><p>{stats.results}</p></article>
      </div>
    </section>
  );
}
