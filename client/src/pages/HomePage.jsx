import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <section>
      <h1>Office Simulator Platform</h1>
      <p>
        Practice Word, Excel, and PowerPoint workflows inside a role-based learning environment.
      </p>
      <Link className="btn" to="/login">Go to Login</Link>
    </section>
  );
}
