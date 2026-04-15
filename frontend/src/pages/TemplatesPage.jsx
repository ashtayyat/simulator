import { useEffect, useMemo, useState } from 'react';
import { Player } from '@remotion/player';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TemplatePreview from '../remotion/TemplatePreview';

export default function TemplatesPage({ mode }) {
  const { token } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ name: '', category: 'powerpoint', scope: mode === 'admin' ? 'public' : 'course', courseId: '', bullets: 'Intro\nFeatures\nSummary' });

  const load = () => api('/templates', { token }).then(setTemplates);

  useEffect(() => {
    load();
    api('/courses', { token }).then(setCourses);
  }, [token]);

  const content = useMemo(() => ({
    title: form.name || 'Template Demo',
    bullets: form.bullets.split('\n').filter(Boolean)
  }), [form]);

  const createTemplate = async (e) => {
    e.preventDefault();
    await api('/templates', {
      method: 'POST',
      token,
      body: {
        name: form.name,
        category: form.category,
        scope: form.scope,
        courseId: form.courseId || undefined,
        content
      }
    });
    setForm({ ...form, name: '' });
    load();
  };

  return (
    <section className="panel-stack">
      <h1>{mode === 'student' ? 'Template Library' : 'Template Management'}</h1>

      {mode !== 'student' && (
        <form className="panel form-grid" onSubmit={createTemplate}>
          <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="word">Word</option>
              <option value="excel">Excel</option>
              <option value="powerpoint">PowerPoint</option>
            </select>
          </label>
          <label>Scope
            <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
              {mode === 'admin' && <option value="public">Public</option>}
              <option value="course">Course</option>
            </select>
          </label>
          <label>Course
            <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">None</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </label>
          <label>Bullet points<textarea value={form.bullets} onChange={(e) => setForm({ ...form, bullets: e.target.value })} /></label>
          <button type="submit">Create Template</button>
        </form>
      )}

      <div className="panel">
        <h3>Remotion Template Preview</h3>
        <Player
          component={TemplatePreview}
          durationInFrames={90}
          compositionWidth={640}
          compositionHeight={360}
          fps={30}
          controls
          inputProps={content}
          style={{ width: '100%', maxWidth: 640, borderRadius: 8, overflow: 'hidden' }}
        />
      </div>

      <div className="panel">
        <h3>Saved Templates</h3>
        <table>
          <thead><tr><th>Name</th><th>Category</th><th>Scope</th><th>Course</th></tr></thead>
          <tbody>{templates.map((t) => <tr key={t.id}><td>{t.name}</td><td>{t.category}</td><td>{t.scope}</td><td>{t.course_id ?? '-'}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
