import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ fullName: '', email: '', password: 'Password123!', role: 'student' });

  const load = () => api('/users', { token }).then(setUsers);
  useEffect(load, [token]);

  const createUser = async (e) => {
    e.preventDefault();
    await api('/users', { method: 'POST', token, body: form });
    setForm({ ...form, fullName: '', email: '' });
    load();
  };

  return (
    <section className="panel-stack">
      <h1>User Management</h1>
      <form onSubmit={createUser} className="panel form-grid">
        <label>Full name<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
        <label>Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Role
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button type="submit">Add user</button>
      </form>
      <div className="panel">
        <table><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>{users.map((u) => <tr key={u.id}><td>{u.full_name}</td><td>{u.email}</td><td>{u.role}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
