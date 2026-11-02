// A local demonstration, not authentication or a shared database.
const KEY = 'office-simulator-demo-v1';
const safeUser = ({ password, ...user }) => user;
export function createDemoApi(storage) {
  let activeUser;
  const seed = () => ({
    users: [
      { id: 1, name: 'Demo Admin', email: 'admin@office.local', role: 'admin' },
      { id: 2, name: 'Demo Teacher', email: 'teacher@office.local', role: 'teacher' },
      { id: 3, name: 'Demo Student', email: 'student@office.local', role: 'student' }
    ],
    courses: [{ id: 1, title: 'Office Basics 101', description: 'Practice Word, Excel and PowerPoint', created_by: 2 }],
    enrollments: [{ id: 1, course_id: 1, student_id: 3, enrolled_by: 1 }],
    templates: [{ id: 1, course_id: 1, created_by: 2, audience: 'course', type: 'powerpoint', title: 'Welcome Deck', content: 'Welcome to Office Basics' }],
    exams: [{ id: 1, course_id: 1, title: 'Office Basics Quiz', created_by: 2, questions: [{ question: 'Which Excel function adds numbers?', hint: 'Three letters', answer: 'SUM' }, { question: 'Which Office application creates presentations?', hint: 'Starts with Power', answer: 'PowerPoint' }] }],
    results: []
  });
  function read() {
    const raw = storage.getItem(KEY);
    if (!raw) { const data = seed(); save(data); return data; }
    return JSON.parse(raw);
  }
  function save(data) { storage.setItem(KEY, JSON.stringify(data)); }
  function enter(role) {
    const user = read().users.find((u) => u.role === role);
    if (!user) throw new Error('Demo role not found');
    activeUser = user.id;
    return { user: safeUser(user), token: 'demo' };
  }
  function reset() { save(seed()); activeUser = undefined; }
  function clear() { activeUser = undefined; }
  async function request(path, body) {
    const data = read();
    const url = new URL(path, 'https://demo.invalid');
    const route = url.pathname;
    if (route === '/auth/login' && body) {
      const user = data.users.find((u) => u.email === body.email);
      const expected = user?.password || ({ admin: 'admin123', teacher: 'teacher123', student: 'student123' }[user?.role]);
      if (!user || body.password !== expected) throw new Error('Invalid demo email or password');
      activeUser = user.id;
      return { user: safeUser(user), token: 'demo' };
    }
    const user = data.users.find((u) => u.id === activeUser);
    if (!user) throw new Error('Choose a demo role first');
    function requireRoles(...roles) { if (!roles.includes(user.role)) throw new Error('This demo role cannot perform that action'); }
    function canAccess(id) {
      id = Number(id);
      return data.courses.some((c) => c.id === id && (user.role === 'admin' || (user.role === 'teacher' && c.created_by === user.id) || (user.role === 'student' && data.enrollments.some((e) => e.course_id === id && e.student_id === user.id))));
    }
    function requireCourse(id) { if (!canAccess(id)) throw new Error('Course access denied'); }
    function add(table, values) {
      const record = { ...values, id: Math.max(0, ...table.map((x) => x.id)) + 1 };
      table.push(record); save(data); return structuredClone(record);
    }
    if (route === '/users') {
      requireRoles('admin', 'teacher');
      if (!body) return data.users.filter((u) => user.role === 'admin' || u.role === 'student').map(safeUser);
      requireRoles('admin');
      if (!body.name || !body.email || !body.password || !['admin','teacher','student'].includes(body.role)) throw new Error('Complete all user fields');
      if (data.users.some((u) => u.email === body.email)) throw new Error('Email already exists');
      return safeUser(add(data.users, body));
    }
    if (route === '/courses') {
      if (!body) return data.courses.filter((c) => canAccess(c.id)).map((c) => ({ ...c, teacher_name: data.users.find((u) => u.id === c.created_by)?.name }));
      requireRoles('admin');
      if (!body.title || !data.users.some((u) => u.id === Number(body.createdBy) && u.role === 'teacher')) throw new Error('Enter a title and select a teacher');
      return add(data.courses, { title: body.title, description: body.description, created_by: Number(body.createdBy) });
    }
    if (route === '/enrollments' && body) {
      requireRoles('admin','teacher'); requireCourse(body.courseId);
      if (!data.users.some((u) => u.id === Number(body.studentId) && u.role === 'student')) throw new Error('Select a student');
      if (!data.enrollments.some((e) => e.course_id === Number(body.courseId) && e.student_id === Number(body.studentId))) add(data.enrollments, { course_id: Number(body.courseId), student_id: Number(body.studentId), enrolled_by: user.id });
      return { message: 'Enrollment saved' };
    }
    let match = route.match(/^\/enrollments\/student\/(\d+)$/);
    if (match) {
      if (user.role !== 'admin' && user.id !== Number(match[1])) throw new Error('Access denied');
      return data.courses.filter((c) => data.enrollments.some((e) => e.course_id === c.id && e.student_id === Number(match[1])));
    }
    if (route === '/templates') {
      if (!body) return data.templates.filter((t) => (t.audience === 'public' || canAccess(t.course_id)) && (!url.searchParams.get('courseId') || t.audience === 'public' || t.course_id === Number(url.searchParams.get('courseId'))));
      requireRoles('admin','teacher');
      if (body.audience === 'public') requireRoles('admin'); else requireCourse(body.courseId);
      if (!body.title || !['word','excel','powerpoint'].includes(body.type)) throw new Error('Enter a template title and type');
      return add(data.templates, { ...body, course_id: Number(body.courseId) || null, created_by: user.id });
    }
    match = route.match(/^\/exams\/course\/(\d+)$/);
    if (match) { requireCourse(match[1]); return data.exams.filter((e) => e.course_id === Number(match[1])).map(({ questions, ...e }) => e); }
    if (route === '/exams' && body) {
      requireRoles('admin','teacher'); requireCourse(body.courseId);
      if (!body.title || !Array.isArray(body.questions) || !body.questions.length || body.questions.some((q) => !q.question?.trim() || !q.answer?.trim())) throw new Error('Enter an exam title and valid question|hint|answer lines');
      return add(data.exams, { course_id: Number(body.courseId), title: body.title, created_by: user.id, questions: body.questions });
    }
    match = route.match(/^\/exams\/(\d+)(\/submit)?$/);
    if (match) {
      const exam = data.exams.find((e) => e.id === Number(match[1]));
      if (!exam) throw new Error('Exam not found');
      requireCourse(exam.course_id);
      if (!match[2]) return { ...exam, questions: user.role === 'student' ? exam.questions.map(({ answer, ...q }) => q) : exam.questions };
      requireRoles('student');
      if (!Array.isArray(body?.answers) || body.answers.length !== exam.questions.length) throw new Error('Complete the exam first');
      if (data.results.some((r) => r.exam_id === exam.id && r.student_id === user.id)) throw new Error('Exam already submitted');
      const correct = exam.questions.filter((q, i) => String(body.answers[i]).trim().toLowerCase() === q.answer.trim().toLowerCase()).length;
      const score = correct / exam.questions.length * 100;
      add(data.results, { exam_id: exam.id, student_id: user.id, score, submitted_at: new Date().toISOString() });
      return { score };
    }
    match = route.match(/^\/results\/course\/(\d+)$/);
    if (match) {
      requireCourse(match[1]);
      return data.results.filter((r) => data.exams.some((e) => e.id === r.exam_id && e.course_id === Number(match[1])) && (user.role !== 'student' || r.student_id === user.id)).map((r) => ({ ...r, exam_title: data.exams.find((e) => e.id === r.exam_id)?.title, student_name: data.users.find((u) => u.id === r.student_id)?.name }));
    }
    throw new Error('Unknown demo action');
  }
  return { enter, reset, clear, request };
}
