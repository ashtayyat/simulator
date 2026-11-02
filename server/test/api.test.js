import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';

test('fresh database role, course, exam and result workflow', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'office-test-'));
  const socket = net.createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  const env = { ...process.env, DB_PATH: join(directory, 'test.db'), PORT: String(port) };
  let child;
  try {
    execFileSync(process.execPath, ['db/init.js'], { env });
    execFileSync(process.execPath, ['db/seed.js'], { env });
    child = spawn(process.execPath, ['index.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { ready = (await fetch(`http://127.0.0.1:${port}/health`)).ok; } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.ok(ready, 'backend starts');
    async function request(path, { token, body, status = 200 } = {}) {
      const response = await fetch(`http://127.0.0.1:${port}/api${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      const data = await response.json();
      assert.equal(response.status, status, `${path}: ${JSON.stringify(data)}`);
      return data;
    }
    const login = (email, password) => request('/auth/login', { body: { email, password } });
    await request('/users', { status: 401 });
    await request('/auth/login', { body: { email: 'admin@office.local', password: 'wrong' }, status: 401 });
    const admin = await login('admin@office.local', 'admin123');
    const teacher = await login('teacher@office.local', 'teacher123');
    const student = await login('student@office.local', 'student123');
    assert.equal(admin.user.password, undefined);
    await request('/users', { token: student.token, status: 403 });
    const outsider = await request('/users', { token: admin.token, status: 201, body: { name: 'Other', email: 'unrelated@example.org', password: 'secret123', role: 'teacher' } });
    const other = await login(outsider.email, 'secret123');
    assert.equal(other.user.role, 'teacher');
    const course = await request('/courses', { token: admin.token, status: 201, body: { title: 'Test course', description: 'Workflow', createdBy: teacher.user.id } });
    await request(`/exams/course/${course.id}`, { token: other.token, status: 403 });
    await request(`/exams/course/${course.id}`, { token: student.token, status: 403 });
    await request('/enrollments', { token: teacher.token, status: 201, body: { courseId: course.id, studentId: student.user.id, enrolledBy: admin.user.id } });
    await request('/exams', { token: teacher.token, status: 400, body: { courseId: course.id, title: 'Empty', questions: [] } });
    await request('/exams', { token: teacher.token, status: 400, body: { courseId: course.id, title: 'Bad', questions: [{ question: 'Q' }] } });
    const exam = await request('/exams', { token: teacher.token, status: 201, body: { courseId: course.id, title: 'Quiz', questions: [{ question: 'Add values?', hint: 'Function', answer: 'SUM' }] } });
    const view = await request(`/exams/${exam.id}`, { token: student.token });
    assert.equal(view.questions_json, undefined);
    assert.equal(view.questions[0].answer, undefined);
    await request(`/exams/${exam.id}`, { token: other.token, status: 403 });
    await request(`/exams/${exam.id}/submit`, { token: student.token, body: { answers: [] }, status: 400 });
    const result = await request(`/exams/${exam.id}/submit`, { token: student.token, status: 201, body: { studentId: admin.user.id, answers: ['sum'] } });
    assert.equal(result.score, 100);
    await request(`/exams/${exam.id}/submit`, { token: student.token, status: 409, body: { answers: ['sum'] } });
    const rows = await request(`/results/course/${course.id}`, { token: teacher.token });
    assert.equal(rows[0].student_id, student.user.id);
    await request(`/results/course/${course.id}`, { token: other.token, status: 403 });
    await request('/templates', { token: teacher.token, status: 403, body: { audience: 'public', type: 'word', title: 'Bad', content: '' } });
    await request('/templates', { token: teacher.token, status: 201, body: { courseId: course.id, audience: 'course', type: 'word', title: 'Private', content: 'Demo' } });
    assert.ok((await request('/templates', { token: student.token })).some((t) => t.title === 'Private'));
    assert.ok(!(await request('/templates', { token: other.token })).some((t) => t.title === 'Private'));
  } finally {
    if (child && child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
    rmSync(directory, { recursive: true, force: true });
  }
});
