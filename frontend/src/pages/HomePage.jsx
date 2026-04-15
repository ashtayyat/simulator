import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <section className="hero">
      <h1>Office Simulator Academy</h1>
      <p>
        Train learners on Word, Excel, and PowerPoint with role-based management for
        Admins, Teachers, and Students.
      </p>
      <div className="actions">
        <Link to="/login" className="button">Login</Link>
      </div>
      <div className="panel-grid">
        <article className="panel">
          <h3>Admin Portal</h3>
          <p>Create courses, users, templates, exams, and monitor all course results.</p>
        </article>
        <article className="panel">
          <h3>Teacher Portal</h3>
          <p>Manage own courses, enroll learners, prepare exams, and publish course templates.</p>
        </article>
        <article className="panel">
          <h3>Student Portal</h3>
          <p>Access enrolled courses, take exams, and review personal performance.</p>
        </article>
      </div>
    </section>
  );
}
