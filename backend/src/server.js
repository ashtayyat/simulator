import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { getDb } from './db.js';
import { authRequired, requireRoles, signToken } from './auth.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const db = await getDb();
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials.' });

  const token = signToken(user);
  return res.json({
    token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role
    }
  });
});

app.get('/me', authRequired, async (req, res) => {
  const db = await getDb();
  const user = await db.get('SELECT id, full_name, email, role FROM users WHERE id = ?', [req.user.id]);
  return res.json(user);
});

app.get('/users', authRequired, requireRoles('admin'), async (_, res) => {
  const db = await getDb();
  const users = await db.all('SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC');
  return res.json(users);
});

app.post('/users', authRequired, requireRoles('admin'), async (req, res) => {
  const { fullName, email, password, role } = req.body;
  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ message: 'fullName, email, password, and role are required.' });
  }

  try {
    const db = await getDb();
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users(full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [fullName, email, passwordHash, role]
    );
    return res.status(201).json({ id: result.lastID });
  } catch (error) {
    return res.status(400).json({ message: 'Could not create user.', details: error.message });
  }
});

app.get('/courses', authRequired, async (req, res) => {
  const db = await getDb();

  if (req.user.role === 'admin') {
    const courses = await db.all(`
      SELECT c.*, u.full_name AS teacher_name
      FROM courses c
      LEFT JOIN users u ON u.id = c.owner_teacher_id
      ORDER BY c.created_at DESC
    `);
    return res.json(courses);
  }

  if (req.user.role === 'teacher') {
    const courses = await db.all(
      'SELECT * FROM courses WHERE owner_teacher_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json(courses);
  }

  const courses = await db.all(
    `SELECT c.* FROM courses c
     JOIN enrollments e ON e.course_id = c.id
     WHERE e.user_id = ?
     ORDER BY c.created_at DESC`,
    [req.user.id]
  );
  return res.json(courses);
});

app.post('/courses', authRequired, requireRoles('admin'), async (req, res) => {
  const { title, description, ownerTeacherId } = req.body;
  if (!title) return res.status(400).json({ message: 'title is required.' });

  const db = await getDb();
  const result = await db.run(
    'INSERT INTO courses(title, description, created_by, owner_teacher_id) VALUES (?, ?, ?, ?)',
    [title, description || '', req.user.id, ownerTeacherId || null]
  );

  return res.status(201).json({ id: result.lastID });
});

app.post('/enrollments', authRequired, requireRoles('admin', 'teacher'), async (req, res) => {
  const { userId, courseId } = req.body;
  if (!userId || !courseId) {
    return res.status(400).json({ message: 'userId and courseId are required.' });
  }

  const db = await getDb();
  if (req.user.role === 'teacher') {
    const allowed = await db.get('SELECT id FROM courses WHERE id = ? AND owner_teacher_id = ?', [courseId, req.user.id]);
    if (!allowed) return res.status(403).json({ message: 'You can only enroll students in your own course.' });
  }

  try {
    await db.run(
      'INSERT INTO enrollments(user_id, course_id, enrolled_by) VALUES (?, ?, ?)',
      [userId, courseId, req.user.id]
    );
    return res.status(201).json({ message: 'Enrollment created.' });
  } catch (error) {
    return res.status(400).json({ message: 'Could not enroll user.', details: error.message });
  }
});

app.get('/courses/:courseId/enrollments', authRequired, async (req, res) => {
  const { courseId } = req.params;
  const db = await getDb();

  if (req.user.role === 'teacher') {
    const allowed = await db.get('SELECT id FROM courses WHERE id = ? AND owner_teacher_id = ?', [courseId, req.user.id]);
    if (!allowed) return res.status(403).json({ message: 'Not your course.' });
  }

  if (req.user.role === 'student') {
    return res.status(403).json({ message: 'Students cannot view enrollment list.' });
  }

  const rows = await db.all(
    `SELECT e.id, u.id AS user_id, u.full_name, u.email, u.role
     FROM enrollments e JOIN users u ON u.id = e.user_id
     WHERE e.course_id = ?`,
    [courseId]
  );

  return res.json(rows);
});

app.post('/exams', authRequired, requireRoles('admin', 'teacher'), async (req, res) => {
  const { courseId, title, questions } = req.body;
  if (!courseId || !title || !Array.isArray(questions)) {
    return res.status(400).json({ message: 'courseId, title, and questions[] are required.' });
  }

  const db = await getDb();
  if (req.user.role === 'teacher') {
    const allowed = await db.get('SELECT id FROM courses WHERE id = ? AND owner_teacher_id = ?', [courseId, req.user.id]);
    if (!allowed) return res.status(403).json({ message: 'You can only create exams for your own course.' });
  }

  const result = await db.run(
    'INSERT INTO exams(course_id, title, questions_json, created_by) VALUES (?, ?, ?, ?)',
    [courseId, title, JSON.stringify(questions), req.user.id]
  );

  return res.status(201).json({ id: result.lastID });
});

app.get('/courses/:courseId/exams', authRequired, async (req, res) => {
  const { courseId } = req.params;
  const db = await getDb();

  if (req.user.role === 'teacher') {
    const allowed = await db.get('SELECT id FROM courses WHERE id = ? AND owner_teacher_id = ?', [courseId, req.user.id]);
    if (!allowed) return res.status(403).json({ message: 'Not your course.' });
  }

  if (req.user.role === 'student') {
    const enrolled = await db.get('SELECT id FROM enrollments WHERE course_id = ? AND user_id = ?', [courseId, req.user.id]);
    if (!enrolled) return res.status(403).json({ message: 'You are not enrolled in this course.' });
  }

  const exams = await db.all('SELECT id, title, created_at FROM exams WHERE course_id = ? ORDER BY created_at DESC', [courseId]);
  return res.json(exams);
});

app.get('/exams/:examId', authRequired, async (req, res) => {
  const db = await getDb();
  const exam = await db.get('SELECT * FROM exams WHERE id = ?', [req.params.examId]);
  if (!exam) return res.status(404).json({ message: 'Exam not found.' });

  if (req.user.role === 'teacher') {
    const allowed = await db.get('SELECT id FROM courses WHERE id = ? AND owner_teacher_id = ?', [exam.course_id, req.user.id]);
    if (!allowed) return res.status(403).json({ message: 'Not your course.' });
  }

  if (req.user.role === 'student') {
    const enrolled = await db.get('SELECT id FROM enrollments WHERE course_id = ? AND user_id = ?', [exam.course_id, req.user.id]);
    if (!enrolled) return res.status(403).json({ message: 'Not enrolled in this course.' });
  }

  const parsed = JSON.parse(exam.questions_json);
  const safeQuestions = req.user.role === 'student'
    ? parsed.map(({ question, options }, i) => ({ index: i, question, options }))
    : parsed;

  return res.json({
    id: exam.id,
    courseId: exam.course_id,
    title: exam.title,
    questions: safeQuestions
  });
});

app.post('/exams/:examId/submit', authRequired, requireRoles('student'), async (req, res) => {
  const db = await getDb();
  const exam = await db.get('SELECT * FROM exams WHERE id = ?', [req.params.examId]);
  if (!exam) return res.status(404).json({ message: 'Exam not found.' });

  const enrolled = await db.get('SELECT id FROM enrollments WHERE course_id = ? AND user_id = ?', [exam.course_id, req.user.id]);
  if (!enrolled) return res.status(403).json({ message: 'You are not enrolled in this course.' });

  const answers = req.body.answers;
  if (!Array.isArray(answers)) return res.status(400).json({ message: 'answers[] is required.' });

  const questions = JSON.parse(exam.questions_json);
  let correct = 0;
  questions.forEach((q, index) => {
    if (answers[index] === q.correctIndex) correct += 1;
  });

  const score = Number(((correct / questions.length) * 100).toFixed(2));

  try {
    await db.run(
      'INSERT INTO exam_results(exam_id, student_id, score, answers_json) VALUES (?, ?, ?, ?)',
      [exam.id, req.user.id, score, JSON.stringify(answers)]
    );
  } catch {
    return res.status(400).json({ message: 'Exam already submitted.' });
  }

  return res.status(201).json({ score, correct, total: questions.length });
});

app.get('/results', authRequired, async (req, res) => {
  const db = await getDb();

  if (req.user.role === 'student') {
    const rows = await db.all(
      `SELECT r.id, r.score, r.submitted_at, e.title AS exam_title, c.title AS course_title
       FROM exam_results r
       JOIN exams e ON e.id = r.exam_id
       JOIN courses c ON c.id = e.course_id
       WHERE r.student_id = ?
       ORDER BY r.submitted_at DESC`,
      [req.user.id]
    );
    return res.json(rows);
  }

  if (req.user.role === 'teacher') {
    const rows = await db.all(
      `SELECT r.id, r.score, r.submitted_at, e.title AS exam_title, c.title AS course_title, u.full_name AS student_name
       FROM exam_results r
       JOIN exams e ON e.id = r.exam_id
       JOIN courses c ON c.id = e.course_id
       JOIN users u ON u.id = r.student_id
       WHERE c.owner_teacher_id = ?
       ORDER BY r.submitted_at DESC`,
      [req.user.id]
    );
    return res.json(rows);
  }

  const rows = await db.all(
    `SELECT r.id, r.score, r.submitted_at, e.title AS exam_title, c.title AS course_title, u.full_name AS student_name
     FROM exam_results r
     JOIN exams e ON e.id = r.exam_id
     JOIN courses c ON c.id = e.course_id
     JOIN users u ON u.id = r.student_id
     ORDER BY r.submitted_at DESC`
  );
  return res.json(rows);
});

app.post('/templates', authRequired, requireRoles('admin', 'teacher'), async (req, res) => {
  const { name, category, scope, content, courseId } = req.body;
  if (!name || !category || !scope || !content) {
    return res.status(400).json({ message: 'name, category, scope, and content are required.' });
  }

  const db = await getDb();

  if (req.user.role === 'teacher') {
    if (scope !== 'course' || !courseId) {
      return res.status(403).json({ message: 'Teachers can only create course-scoped templates.' });
    }
    const allowed = await db.get('SELECT id FROM courses WHERE id = ? AND owner_teacher_id = ?', [courseId, req.user.id]);
    if (!allowed) return res.status(403).json({ message: 'Not your course.' });
  }

  const result = await db.run(
    'INSERT INTO templates(name, category, scope, content_json, course_id, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [name, category, scope, JSON.stringify(content), courseId || null, req.user.id]
  );

  return res.status(201).json({ id: result.lastID });
});

app.get('/templates', authRequired, async (req, res) => {
  const db = await getDb();
  const { courseId } = req.query;

  let query = `
    SELECT t.*, u.full_name AS creator_name
    FROM templates t
    JOIN users u ON u.id = t.created_by
    WHERE 1=1
  `;
  const args = [];

  if (req.user.role === 'student') {
    query += ' AND (t.scope = "public" OR (t.scope = "course" AND t.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?)))';
    args.push(req.user.id);
  }

  if (req.user.role === 'teacher') {
    query += ' AND (t.scope = "public" OR (t.scope = "course" AND t.course_id IN (SELECT id FROM courses WHERE owner_teacher_id = ?)))';
    args.push(req.user.id);
  }

  if (courseId) {
    query += ' AND (t.course_id = ? OR t.scope = "public")';
    args.push(courseId);
  }

  query += ' ORDER BY t.created_at DESC';

  const rows = await db.all(query, args);
  const payload = rows.map((row) => ({
    ...row,
    content: JSON.parse(row.content_json)
  }));

  return res.json(payload);
});

app.listen(port, async () => {
  await getDb();
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});
