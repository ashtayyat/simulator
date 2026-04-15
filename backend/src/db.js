import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'office_simulator.db');

let db;

export async function getDb() {
  if (db) return db;

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec('PRAGMA foreign_keys = ON');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      created_by INTEGER NOT NULL,
      owner_teacher_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (owner_teacher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      enrolled_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (enrolled_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      questions_json TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('word','excel','powerpoint')),
      scope TEXT NOT NULL CHECK(scope IN ('public','course')),
      content_json TEXT NOT NULL,
      course_id INTEGER,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exam_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      score REAL NOT NULL,
      answers_json TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(exam_id, student_id),
      FOREIGN KEY (exam_id) REFERENCES exams(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    );
  `);

  await seedIfNeeded(db);
  return db;
}

async function seedIfNeeded(dbConn) {
  const existingAdmin = await dbConn.get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (existingAdmin) return;

  const passwordHash = await bcrypt.hash('Password123!', 10);

  await dbConn.run(
    `INSERT INTO users(full_name, email, password_hash, role) VALUES (?, ?, ?, 'admin')`,
    ['Platform Administrator', 'admin@office-sim.com', passwordHash]
  );
  await dbConn.run(
    `INSERT INTO users(full_name, email, password_hash, role) VALUES (?, ?, ?, 'teacher')`,
    ['Sample Teacher', 'teacher@office-sim.com', passwordHash]
  );
  await dbConn.run(
    `INSERT INTO users(full_name, email, password_hash, role) VALUES (?, ?, ?, 'student')`,
    ['Sample Student', 'student@office-sim.com', passwordHash]
  );
}
