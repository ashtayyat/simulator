import { Navigate, Route, Routes } from 'react-router-dom';
import PortalLayout from './layouts/PortalLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import TeacherPage from './pages/TeacherPage';
import StudentPage from './pages/StudentPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PortalLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route
          path="admin"
          element={(
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="teacher"
          element={(
            <ProtectedRoute role="teacher">
              <TeacherPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="student"
          element={(
            <ProtectedRoute role="student">
              <StudentPage />
            </ProtectedRoute>
          )}
        />
      </Route>
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
