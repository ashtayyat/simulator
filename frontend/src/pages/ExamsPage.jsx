import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const starterQuestion = { question: 'What is a spreadsheet primarily used for?', options: ['Slides', 'Calculations', 'Emails', 'Audio'], correctIndex: 1 };

export default function ExamsPage({ mode }) {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [exams, setExams] = useState([]);
  const [newExam, setNewExam] = useState({ title: '', questions: [starterQuestion] });

  const [activeExam, setActiveExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api('/courses', { token }).then((list) => {
      setCourses(list);
      if (list[0]) setSelectedCourseId(String(list[0].id));
    });
  }, [token]);

  useEffect(() => {
    if (!selectedCourseId) return;
    api(`/courses/${selectedCourseId}/exams`, { token }).then(setExams);
  }, [selectedCourseId, token]);

  const createExam = async (e) => {
    e.preventDefault();
    await api('/exams', {
      method: 'POST',
      token,
      body: { courseId: Number(selectedCourseId), title: newExam.title, questions: newExam.questions }
    });
    setNewExam({ title: '', questions: [starterQuestion] });
    const refreshed = await api(`/courses/${selectedCourseId}/exams`, { token });
    setExams(refreshed);
  };

  const openExam = async (examId) => {
    const exam = await api(`/exams/${examId}`, { token });
    setActiveExam(exam);
    setAnswers(new Array(exam.questions.length).fill(null));
    setResult(null);
  };

  const submitExam = async () => {
    const response = await api(`/exams/${activeExam.id}/submit`, { method: 'POST', token, body: { answers } });
    setResult(response);
  };

  return (
    <section className="panel-stack">
      <h1>{mode === 'student' ? 'Take Exams' : 'Exam Management'}</h1>
      <div className="panel">
        <label>Course
          <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </label>
      </div>

      {(mode === 'admin' || mode === 'teacher') && (
        <form className="panel form-grid" onSubmit={createExam}>
          <h3>Create Exam</h3>
          <label>Exam title<input value={newExam.title} onChange={(e) => setNewExam({ ...newExam, title: e.target.value })} /></label>
          <label>Question
            <input
              value={newExam.questions[0].question}
              onChange={(e) => setNewExam({ ...newExam, questions: [{ ...newExam.questions[0], question: e.target.value }] })}
            />
          </label>
          <button type="submit">Create Exam</button>
        </form>
      )}

      <div className="panel">
        <h3>Exams</h3>
        {exams.map((exam) => (
          <button key={exam.id} onClick={() => openExam(exam.id)}>{exam.title}</button>
        ))}
      </div>

      {activeExam && (
        <div className="panel">
          <h3>{activeExam.title}</h3>
          {activeExam.questions.map((q, index) => (
            <div key={q.index ?? index}>
              <p>{q.question}</p>
              {q.options.map((option, oIndex) => (
                <label key={option}>
                  <input type="radio" name={`q-${index}`} onChange={() => {
                    const copy = [...answers];
                    copy[index] = oIndex;
                    setAnswers(copy);
                  }} />
                  {option}
                </label>
              ))}
            </div>
          ))}
          {mode === 'student' && <button onClick={submitExam}>Submit Exam</button>}
          {result && <p className="success">Score: {result.score}% ({result.correct}/{result.total})</p>}
        </div>
      )}
    </section>
  );
}
