import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api/http';
import { useAuth } from '../context/AuthContext';

export default function StudentPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [templates, setTemplates] = useState([]);
  const [exams, setExams] = useState([]);
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(null);

  useEffect(() => {
    (async () => {
      const c = await apiGet(`/enrollments/student/${user.id}`);
      setCourses(c);
      if (c[0]) setSelectedCourse(String(c[0].id));
    })();
  }, [user.id]);

  useEffect(() => {
    if (!selectedCourse) return;
    (async () => {
      const [t, e] = await Promise.all([
        apiGet(`/templates?courseId=${selectedCourse}`),
        apiGet(`/exams/course/${selectedCourse}`)
      ]);
      setTemplates(t);
      setExams(e);
    })();
  }, [selectedCourse]);

  const startExam = async (examId) => {
    const data = await apiGet(`/exams/${examId}`);
    setExam(data);
    setAnswers(new Array(data.questions.length).fill(''));
    setScore(null);
  };

  const submitExam = async () => {
    const result = await apiPost(`/exams/${exam.id}/submit`, { studentId: user.id, answers });
    setScore(result.score);
  };

  return (
    <section>
      <h1>Student Portal</h1>
      <p>Access enrolled courses, download templates, and take exams.</p>

      <div className="panel">
        <h3>My Courses</h3>
        <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div className="grid">
        <div className="panel">
          <h3>Templates</h3>
          <ul>
            {templates.map((t) => <li key={t.id}>{t.type.toUpperCase()} - {t.title}</li>)}
          </ul>
        </div>

        <div className="panel">
          <h3>Exams</h3>
          <ul>
            {exams.map((e) => (
              <li key={e.id}>
                {e.title} <button className="btn small" onClick={() => startExam(e.id)}>Take Exam</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {exam && (
        <div className="panel">
          <h3>{exam.title}</h3>
          {exam.questions.map((q, idx) => (
            <div key={idx} className="question">
              <p>{idx + 1}. {q.question}</p>
              <small>Hint: {q.hint}</small>
              <input
                value={answers[idx] || ''}
                onChange={(e) => {
                  const next = [...answers];
                  next[idx] = e.target.value;
                  setAnswers(next);
                }}
              />
            </div>
          ))}
          <button className="btn" onClick={submitExam}>Submit Exam</button>
          {score !== null && <p>Your score: {score.toFixed(2)}%</p>}
        </div>
      )}
    </section>
  );
}
