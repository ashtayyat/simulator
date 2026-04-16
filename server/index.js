import express from 'express';
import cors from 'cors';
import { db } from './db/connection.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db
    .prepare('SELECT id, name, email, role FROM users WHERE email = ? AND password = ?')
    .get(email, password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.json({ user });
});

app.get('/api/users', (_, res) => {
  const users = db.prepare('SELECT id, name, email, role FROM users ORDER BY id DESC').all();
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { name, email, password, role } = req.body;
  const info = db
    .prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
    .run(name, email, password, role);
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(user);
});

app.get('/api/courses', (_, res) => {
  const courses = db
    .prepare(
      `SELECT c.id, c.title, c.description, c.created_by, u.name AS teacher_name
       FROM courses c
       JOIN users u ON u.id = c.created_by
       ORDER BY c.id DESC`
    )
    .all();
  res.json(courses);
});

app.post('/api/courses', (req, res) => {
  const { title, description, createdBy } = req.body;
  const info = db
    .prepare('INSERT INTO courses (title, description, created_by) VALUES (?, ?, ?)')
    .run(title, description, createdBy);
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(course);
});

app.post('/api/enrollments', (req, res) => {
  const { courseId, studentId, enrolledBy } = req.body;
  db.prepare('INSERT OR IGNORE INTO enrollments (course_id, student_id, enrolled_by) VALUES (?, ?, ?)').run(
    courseId,
    studentId,
    enrolledBy
  );
  res.status(201).json({ message: 'Enrollment saved' });
});

app.get('/api/enrollments/student/:studentId', (req, res) => {
  const { studentId } = req.params;
  const courses = db
    .prepare(
      `SELECT c.*
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = ?`
    )
    .all(studentId);
  res.json(courses);
});

app.get('/api/templates', (req, res) => {
  const { courseId } = req.query;
  const templates = courseId
    ? db.prepare('SELECT * FROM templates WHERE course_id = ? OR audience = ? ORDER BY id DESC').all(courseId, 'public')
    : db.prepare('SELECT * FROM templates ORDER BY id DESC').all();
  res.json(templates);
});

app.post('/api/templates', (req, res) => {
  const { courseId, createdBy, audience, type, title, content } = req.body;
  const info = db
    .prepare(
      'INSERT INTO templates (course_id, created_by, audience, type, title, content) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(courseId ?? null, createdBy, audience, type, title, content);
  res.status(201).json(db.prepare('SELECT * FROM templates WHERE id = ?').get(info.lastInsertRowid));
});

app.get('/api/exams/course/:courseId', (req, res) => {
  const exams = db.prepare('SELECT id, course_id, title, created_by, created_at FROM exams WHERE course_id = ?').all(req.params.courseId);
  res.json(exams);
});

app.post('/api/exams', (req, res) => {
  const { courseId, title, createdBy, questions } = req.body;
  const info = db
    .prepare('INSERT INTO exams (course_id, title, created_by, questions_json) VALUES (?, ?, ?, ?)')
    .run(courseId, title, createdBy, JSON.stringify(questions || []));
  res.status(201).json(db.prepare('SELECT * FROM exams WHERE id = ?').get(info.lastInsertRowid));
});

app.get('/api/exams/:examId', (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.examId);
  if (!exam) return res.status(404).json({ message: 'Exam not found' });
  res.json({ ...exam, questions: JSON.parse(exam.questions_json) });
});

app.post('/api/exams/:examId/submit', (req, res) => {
  const { examId } = req.params;
  const { studentId, answers } = req.body;
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
  if (!exam) return res.status(404).json({ message: 'Exam not found' });

  const questions = JSON.parse(exam.questions_json);
  let correct = 0;
  questions.forEach((q, idx) => {
    if (String(answers?.[idx] ?? '').trim().toLowerCase() === String(q.answer).trim().toLowerCase()) {
      correct += 1;
    }
  });
  const score = questions.length ? (correct / questions.length) * 100 : 0;

  db.prepare('INSERT INTO exam_results (exam_id, student_id, score, answers_json) VALUES (?, ?, ?, ?)').run(
    examId,
    studentId,
    score,
    JSON.stringify(answers || [])
  );

  res.status(201).json({ score });
});

app.get('/api/results/course/:courseId', (req, res) => {
  const rows = db
    .prepare(
      `SELECT er.id, er.score, er.submitted_at, e.title AS exam_title, u.name AS student_name
       FROM exam_results er
       JOIN exams e ON e.id = er.exam_id
       JOIN users u ON u.id = er.student_id
       WHERE e.course_id = ?
       ORDER BY er.submitted_at DESC`
    )
    .all(req.params.courseId);
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
