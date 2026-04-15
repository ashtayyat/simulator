import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PortalLayout from './layouts/PortalLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import CoursesPage from './pages/CoursesPage';
import ExamsPage from './pages/ExamsPage';
import TemplatesPage from './pages/TemplatesPage';
import ResultsPage from './pages/ResultsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={(
          <ProtectedRoute>
            <PortalLayout />
          </ProtectedRoute>
        )}
      >
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute roles={['admin']}><CoursesPage mode="admin" /></ProtectedRoute>} />
        <Route path="/admin/exams" element={<ProtectedRoute roles={['admin']}><ExamsPage mode="admin" /></ProtectedRoute>} />
        <Route path="/admin/templates" element={<ProtectedRoute roles={['admin']}><TemplatesPage mode="admin" /></ProtectedRoute>} />
        <Route path="/admin/results" element={<ProtectedRoute roles={['admin']}><ResultsPage mode="admin" /></ProtectedRoute>} />

        <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/teacher/courses" element={<ProtectedRoute roles={['teacher']}><CoursesPage mode="teacher" /></ProtectedRoute>} />
        <Route path="/teacher/exams" element={<ProtectedRoute roles={['teacher']}><ExamsPage mode="teacher" /></ProtectedRoute>} />
        <Route path="/teacher/templates" element={<ProtectedRoute roles={['teacher']}><TemplatesPage mode="teacher" /></ProtectedRoute>} />
        <Route path="/teacher/results" element={<ProtectedRoute roles={['teacher']}><ResultsPage mode="teacher" /></ProtectedRoute>} />

        <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/courses" element={<ProtectedRoute roles={['student']}><CoursesPage mode="student" /></ProtectedRoute>} />
        <Route path="/student/exams" element={<ProtectedRoute roles={['student']}><ExamsPage mode="student" /></ProtectedRoute>} />
        <Route path="/student/templates" element={<ProtectedRoute roles={['student']}><TemplatesPage mode="student" /></ProtectedRoute>} />
        <Route path="/student/results" element={<ProtectedRoute roles={['student']}><ResultsPage mode="student" /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
