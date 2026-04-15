import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ResultsPage({ mode }) {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api('/results', { token }).then(setRows);
  }, [token]);

  return (
    <section className="panel-stack">
      <h1>{mode === 'student' ? 'My Results' : 'Course Results'}</h1>
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Exam</th>
              {mode !== 'student' && <th>Student</th>}
              <th>Score</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.course_title}</td>
                <td>{row.exam_title}</td>
                {mode !== 'student' && <td>{row.student_name}</td>}
                <td>{row.score}%</td>
                <td>{new Date(row.submitted_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
