import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost, setApiToken, DEMO_MODE, enterDemo } from '../api/http';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await apiPost('/auth/login', { email, password });
      setApiToken(data.token);
      setUser(data.user);
      navigate(`/${data.user.role}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <h1>Login</h1>
      {DEMO_MODE && <div className="panel">
        <h2>Try a demo role</h2>
        <p>No account needed. Switch roles using Logout. Use sample information only.</p>
        {['admin', 'teacher', 'student'].map((role) => <button key={role} className="btn" onClick={() => {
          const data = enterDemo(role);
          setApiToken(data.token); setUser(data.user); navigate(`/${data.user.role}`);
        }}>Try as {role}</button>)}
      </div>}
      {!DEMO_MODE && <form className="panel" onSubmit={submit}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn" type="submit">Login</button>
        {error && <p className="error">{error}</p>}
      </form>}
    </section>
  );
}

