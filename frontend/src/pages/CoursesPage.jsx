import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function CoursesPage({ mode }) {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', ownerTeacherId: '' });
  const [enroll, setEnroll] = useState({ userId: '', courseId: '' });

  const loadCourses = () => api('/courses', { token }).then(setCourses);

  useEffect(() => {
    loadCourses();
    if (mode === 'admin') {
      api('/users', { token }).then(setUsers);
    }
  }, [token, mode]);

  const createCourse = async (e) => {
    e.preventDefault();
    await api('/courses', { method: 'POST', token, body: form });
    setForm({ title: '', description: '', ownerTeacherId: '' });
    loadCourses();
  };

  const enrollUser = async (e) => {
    e.preventDefault();
    await api('/enrollments', { method: 'POST', token, body: enroll });
    setEnroll({ userId: '', courseId: '' });
  };

  return (
    <section className="panel-stack">
      <h1>{mode === 'student' ? 'My Courses' : 'Course Management'}</h1>

      {mode === 'admin' && (
        <form className="panel form-grid" onSubmit={createCourse}>
          <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>Description<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label>Owner Teacher
            <select value={form.ownerTeacherId} onChange={(e) => setForm({ ...form, ownerTeacherId: Number(e.target.value) || '' })}>
              <option value="">Unassigned</option>
              {users.filter((u) => u.role === 'teacher').map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </label>
          <button type="submit">Create Course</button>
        </form>
      )}

      {(mode === 'admin' || mode === 'teacher') && (
        <form className="panel form-grid" onSubmit={enrollUser}>
          <h3>Enroll User</h3>
          <label>User ID<input value={enroll.userId} onChange={(e) => setEnroll({ ...enroll, userId: Number(e.target.value) || '' })} /></label>
          <label>Course ID<input value={enroll.courseId} onChange={(e) => setEnroll({ ...enroll, courseId: Number(e.target.value) || '' })} /></label>
          <button type="submit">Enroll</button>
        </form>
      )}

      <div className="panel">
        <table>
          <thead><tr><th>ID</th><th>Title</th><th>Description</th><th>Teacher ID</th></tr></thead>
          <tbody>{courses.map((course) => <tr key={course.id}><td>{course.id}</td><td>{course.title}</td><td>{course.description}</td><td>{course.owner_teacher_id ?? '-'}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
