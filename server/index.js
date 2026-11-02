import express from 'express';
import cors from 'cors';
import { randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword } from './passwords.js';
import { db } from './db/connection.js';

const app = express();
const PORT = process.env.PORT || 4000;
const sessions = new Map();

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) return res.status(400).json({ message: 'Email and password required' });
  const user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email);

  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (!user.password.startsWith('scrypt:')) {
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashPassword(password), user.id);
  }
  const token = randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, expires: Date.now() + 12 * 60 * 60 * 1000 });
  const { password: _, ...safeUser } = user;
  return res.json({ user: safeUser, token });
});

// All API routes below require a server-issued session; client-supplied IDs are not identity.
app.use('/api', (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  const session = sessions.get(token);
  if (!session || session.expires <= Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ message: 'Login required' });
  }
  req.user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(session.userId);
  if (!req.user) return res.status(401).json({ message: 'Invalid session' });
  next();
});
const roles = (...allowed) => (req, res, next) => allowed.includes(req.user.role)
  ? next() : res.status(403).json({ message: 'Forbidden' });
function canAccess(user, courseId) {
  if (user.role === 'admin') return Boolean(db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId));
  if (user.role === 'teacher') return Boolean(db.prepare('SELECT id FROM courses WHERE id = ? AND created_by = ?').get(courseId, user.id));
  return Boolean(db.prepare('SELECT id FROM enrollments WHERE course_id = ? AND student_id = ?').get(courseId, user.id));
}
const courseAccess = (req, res, next) => canAccess(req.user, req.params.courseId || req.body.courseId)
  ? next() : res.status(403).json({ message: 'Course access denied' });

app.get('/api/users', roles('admin', 'teacher'), (req, res) => {
  const users = db.prepare('SELECT id, name, email, role FROM users ORDER BY id DESC').all();
  res.json(req.user.role === 'teacher' ? users.filter((u) => u.role === 'student') : users);
});

app.post('/api/users', roles('admin'), (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || typeof password !== 'string' || !password || !['admin', 'teacher', 'student'].includes(role)) return res.status(400).json({ message: 'Valid name, email, password and role required' });
  const info = db
    .prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
    .run(name, email, hashPassword(password), role);
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(user);
});

app.get('/api/courses', (req, res) => {
  const courses = db
    .prepare(
      `SELECT c.id, c.title, c.description, c.created_by, u.name AS teacher_name
       FROM courses c
       JOIN users u ON u.id = c.created_by
       ORDER BY c.id DESC`
    )
    .all();
  res.json(courses.filter((c) => canAccess(req.user, c.id)));
});

app.post('/api/courses', roles('admin'), (req, res) => {
  const { title, description, createdBy } = req.body;
  if (!title || !db.prepare("SELECT id FROM users WHERE id = ? AND role = 'teacher'").get(createdBy)) return res.status(400).json({ message: 'Title and valid teacher required' });
  const info = db
    .prepare('INSERT INTO courses (title, description, created_by) VALUES (?, ?, ?)')
    .run(title, description, createdBy);
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(course);
});

app.post('/api/enrollments', roles('admin', 'teacher'), courseAccess, (req, res) => {
  const { courseId, studentId } = req.body;
  const enrolledBy = req.user.id;
  if (!db.prepare("SELECT id FROM users WHERE id = ? AND role = 'student'").get(studentId)) return res.status(400).json({ message: 'Valid student required' });
  db.prepare('INSERT OR IGNORE INTO enrollments (course_id, student_id, enrolled_by) VALUES (?, ?, ?)').run(
    courseId,
    studentId,
    enrolledBy
  );
  res.status(201).json({ message: 'Enrollment saved' });
});

app.get('/api/enrollments/student/:studentId', (req, res) => {
  const { studentId } = req.params;
  if (req.user.role !== 'admin' && String(req.user.id) !== studentId) return res.status(403).json({ message: 'Forbidden' });
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
  res.json(templates.filter((t) => t.audience === 'public' || canAccess(req.user, t.course_id)));
});

app.post('/api/templates', roles('admin', 'teacher'), (req, res) => {
  const { courseId, audience, type, title, content } = req.body;
  const createdBy = req.user.id;
  if (!['public', 'course'].includes(audience) || !['word', 'excel', 'powerpoint'].includes(type) || !title || typeof content !== 'string') return res.status(400).json({ message: 'Invalid template' });
  if ((audience === 'public' && req.user.role !== 'admin') || (audience === 'course' && !canAccess(req.user, courseId))) return res.status(403).json({ message: 'Forbidden' });
  const info = db
    .prepare(
      'INSERT INTO templates (course_id, created_by, audience, type, title, content) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(courseId ?? null, createdBy, audience, type, title, content);
  res.status(201).json(db.prepare('SELECT * FROM templates WHERE id = ?').get(info.lastInsertRowid));
});

app.get('/api/exams/course/:courseId', courseAccess, (req, res) => {
  const exams = db.prepare('SELECT id, course_id, title, created_by, created_at FROM exams WHERE course_id = ?').all(req.params.courseId);
  res.json(exams);
});

app.post('/api/exams', roles('admin', 'teacher'), courseAccess, (req, res) => {
  const { courseId, title, questions } = req.body;
  const createdBy = req.user.id;
  if (!title || !Array.isArray(questions) || !questions.length || questions.some((q) => !q || typeof q.question !== 'string' || !q.question.trim() || typeof q.answer !== 'string' || !q.answer.trim())) return res.status(400).json({ message: 'Nonempty questions with text and answers required' });
  const info = db
    .prepare('INSERT INTO exams (course_id, title, created_by, questions_json) VALUES (?, ?, ?, ?)')
    .run(courseId, title, createdBy, JSON.stringify(questions || []));
  res.status(201).json(db.prepare('SELECT * FROM exams WHERE id = ?').get(info.lastInsertRowid));
});

app.get('/api/exams/:examId', (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.examId);
  if (!exam) return res.status(404).json({ message: 'Exam not found' });
  if (!canAccess(req.user, exam.course_id)) return res.status(403).json({ message: 'Forbidden' });
  const questions = JSON.parse(exam.questions_json);
  const { questions_json: _, ...safeExam } = exam;
  res.json({ ...safeExam, questions: req.user.role === 'student' ? questions.map(({ answer, ...q }) => q) : questions });
});

app.post('/api/exams/:examId/submit', roles('student'), (req, res) => {
  const { examId } = req.params;
  const { answers } = req.body;
  const studentId = req.user.id;
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
  if (!exam) return res.status(404).json({ message: 'Exam not found' });

  if (!canAccess(req.user, exam.course_id)) return res.status(403).json({ message: 'Forbidden' });
  const questions = JSON.parse(exam.questions_json);
  if (!questions.length || !Array.isArray(answers) || answers.length !== questions.length || answers.some((a) => typeof a !== 'string')) return res.status(400).json({ message: 'Valid answers required' });
  if (db.prepare('SELECT id FROM exam_results WHERE exam_id = ? AND student_id = ?').get(examId, studentId)) return res.status(409).json({ message: 'Exam already submitted' });
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

app.get('/api/results/course/:courseId', courseAccess, (req, res) => {
  const rows = db
    .prepare(
      `SELECT er.id, er.student_id, er.score, er.submitted_at, e.title AS exam_title, u.name AS student_name
       FROM exam_results er
       JOIN exams e ON e.id = er.exam_id
       JOIN users u ON u.id = er.student_id
       WHERE e.course_id = ?
       ORDER BY er.submitted_at DESC`
    )
    .all(req.params.courseId);
  res.json(req.user.role === 'student' ? rows.filter((r) => r.student_id === req.user.id) : rows);
});

app.use((error, req, res, next) => {
  console.error(error.message);
  res.status(error.code?.startsWith('SQLITE_CONSTRAINT') ? 400 : 500).json({ message: 'Request could not be completed' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

