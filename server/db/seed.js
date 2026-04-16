import { db } from './connection.js';

const insertUser = db.prepare(
  'INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
);

insertUser.run('System Admin', 'admin@office.local', 'admin123', 'admin');
insertUser.run('Demo Teacher', 'teacher@office.local', 'teacher123', 'teacher');
insertUser.run('Demo Student', 'student@office.local', 'student123', 'student');

const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
const teacher = db.prepare("SELECT id FROM users WHERE role = 'teacher' LIMIT 1").get();
const student = db.prepare("SELECT id FROM users WHERE role = 'student' LIMIT 1").get();

if (teacher) {
  const existingCourse = db.prepare('SELECT id FROM courses WHERE title = ?').get('Office Basics 101');
  let courseId = existingCourse?.id;

  if (!courseId) {
    const course = db
      .prepare('INSERT INTO courses (title, description, created_by) VALUES (?, ?, ?)')
      .run('Office Basics 101', 'Introduction to Word, Excel, and PowerPoint tools', teacher.id);
    courseId = Number(course.lastInsertRowid);
  }

  if (student && admin && courseId) {
    db.prepare(
      'INSERT OR IGNORE INTO enrollments (course_id, student_id, enrolled_by) VALUES (?, ?, ?)'
    ).run(courseId, student.id, admin.id);

    db.prepare(
      'INSERT OR IGNORE INTO templates (course_id, created_by, audience, type, title, content) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(courseId, teacher.id, 'course', 'powerpoint', 'Course Intro Deck', 'Slide 1: Welcome\\nSlide 2: Objectives');
  }
}

console.log('Seed data inserted successfully.');
