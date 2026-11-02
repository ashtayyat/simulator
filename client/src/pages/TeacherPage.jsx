import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api/http';
import { useAuth } from '../context/AuthContext';
import SlideTemplatePreview from '../components/SlideTemplatePreview';

export default function TeacherPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  const [enroll, setEnroll] = useState({ courseId: '', studentId: '' });
  const [template, setTemplate] = useState({ courseId: '', type: 'powerpoint', title: '', content: '' });
  const [exam, setExam] = useState({ courseId: '', title: '', questionsText: 'What is SUM in Excel?|Function used to add values|SUM' });

  useEffect(() => {
    (async () => {
      const [allCourses, allUsers] = await Promise.all([apiGet('/courses'), apiGet('/users')]);
      const mine = allCourses.filter((c) => c.created_by === user.id);
      setCourses(mine);
      setStudents(allUsers.filter((u) => u.role === 'student'));
      const firstCourse = mine[0];
      if (firstCourse) {
        setSelectedCourse(String(firstCourse.id));
        setEnroll({ courseId: String(firstCourse.id), studentId: '' });
        setTemplate((s) => ({ ...s, courseId: String(firstCourse.id) }));
        setExam((s) => ({ ...s, courseId: String(firstCourse.id) }));
      }
    })();
  }, [user.id]);

  const loadTemplates = async (courseId) => {
    setTemplates(await apiGet(`/templates?courseId=${courseId}`));
  };

  useEffect(() => {
    if (selectedCourse) loadTemplates(selectedCourse);
  }, [selectedCourse]);

  return (
    <section>
      <h1>Teacher Portal</h1>
      <p>Enroll students, create exams, and publish templates for your courses.</p>

      <div className="grid">
        <div className="panel">
          <h3>Enroll Student</h3>
          <select value={enroll.courseId} onChange={(e) => setEnroll({ ...enroll, courseId: e.target.value })}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select value={enroll.studentId} onChange={(e) => setEnroll({ ...enroll, studentId: e.target.value })}>
            <option value="">Select student</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button className="btn" onClick={() => apiPost('/enrollments', { ...enroll, enrolledBy: user.id })}>Enroll</button>
        </div>

        <div className="panel">
          <h3>Create Template</h3>
          <select value={template.courseId} onChange={(e) => setTemplate({ ...template, courseId: e.target.value })}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select value={template.type} onChange={(e) => setTemplate({ ...template, type: e.target.value })}>
            <option value="word">Word</option>
            <option value="excel">Excel</option>
            <option value="powerpoint">PowerPoint</option>
          </select>
          <input placeholder="Template title" value={template.title} onChange={(e) => setTemplate({ ...template, title: e.target.value })} />
          <textarea placeholder="Template content" value={template.content} onChange={(e) => setTemplate({ ...template, content: e.target.value })} />
          <button className="btn" onClick={async () => {
            await apiPost('/templates', { ...template, audience: 'course', createdBy: user.id });
            await loadTemplates(template.courseId);
          }}>Save Template</button>
        </div>

        <div className="panel">
          <h3>Create Exam</h3>
          <select value={exam.courseId} onChange={(e) => setExam({ ...exam, courseId: e.target.value })}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <input placeholder="Exam title" value={exam.title} onChange={(e) => setExam({ ...exam, title: e.target.value })} />
          <textarea
            value={exam.questionsText}
            onChange={(e) => setExam({ ...exam, questionsText: e.target.value })}
            placeholder="One question line: question|hint|answer"
          />
          <button className="btn" onClick={() => {
            const questions = exam.questionsText
              .split('\n')
              .filter(Boolean)
              .map((line) => {
                const [question, hint, answer] = line.split('|');
                return { question, hint, answer };
              });
            apiPost('/exams', { courseId: exam.courseId, title: exam.title, createdBy: user.id, questions });
          }}>Create Exam</button>
        </div>
      </div>

      <div className="panel">
        <h3>Remotion Slide Preview</h3>
        <SlideTemplatePreview title="Teacher Template Demo" subtitle="PowerPoint simulator preview" />
      </div>

      <div className="panel">
        <h3>Course Templates</h3>
        <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <ul>
          {templates.filter((t) => t.course_id === Number(selectedCourse)).map((t) => (
            <li key={t.id}>{t.type.toUpperCase()} - {t.title}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
