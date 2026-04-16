import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api/http';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [results, setResults] = useState([]);
  const [courseForResults, setCourseForResults] = useState('');

  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' });
  const [newCourse, setNewCourse] = useState({ title: '', description: '', createdBy: '' });

  const loadData = async () => {
    const [u, c] = await Promise.all([apiGet('/users'), apiGet('/courses')]);
    setUsers(u);
    setCourses(c);
    if (!newCourse.createdBy) {
      const firstTeacher = u.find((x) => x.role === 'teacher');
      if (firstTeacher) setNewCourse((s) => ({ ...s, createdBy: String(firstTeacher.id) }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <section>
      <h1>Admin Portal</h1>
      <p>Manage users, courses, templates, exams, enrollments, and results by course.</p>

      <div className="grid">
        <div className="panel">
          <h3>Create User</h3>
          <input placeholder="Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
          <input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          <input placeholder="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
          <button className="btn" onClick={async () => { await apiPost('/users', newUser); await loadData(); }}>Add User</button>
        </div>

        <div className="panel">
          <h3>Create Course</h3>
          <input placeholder="Course title" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} />
          <textarea placeholder="Course description" value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
          <select value={newCourse.createdBy} onChange={(e) => setNewCourse({ ...newCourse, createdBy: e.target.value })}>
            <option value="">Select Teacher</option>
            {users.filter((u) => u.role === 'teacher').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button className="btn" onClick={async () => { await apiPost('/courses', newCourse); await loadData(); }}>Add Course</button>
        </div>
      </div>

      <div className="panel">
        <h3>Course Results</h3>
        <select value={courseForResults} onChange={(e) => setCourseForResults(e.target.value)}>
          <option value="">Select course</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <button className="btn" onClick={async () => setResults(await apiGet(`/results/course/${courseForResults}`))}>Load Results</button>
        <ul>
          {results.map((r) => (
            <li key={r.id}>{r.student_name} - {r.exam_title} - {r.score.toFixed(2)}%</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
