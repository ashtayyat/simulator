import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@office-sim.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      const role = email.includes('teacher') ? 'teacher' : email.includes('student') ? 'student' : 'admin';
      navigate(`/${role}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="center-card">
      <form className="panel" onSubmit={onSubmit}>
        <h2>Login</h2>
        <p className="muted">Demo users: admin@office-sim.com / teacher@office-sim.com / student@office-sim.com</p>
        <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Sign in</button>
      </form>
    </section>
  );
}
