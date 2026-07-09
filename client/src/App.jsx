import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './features/auth/AuthContext';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import CourseDetail from './pages/CourseDetail';
import LessonPlayer from './pages/LessonPlayer';
import MyLearning from './pages/MyLearning';
import AdminDashboard from './pages/admin/AdminDashboard';
import CourseEditor from './pages/admin/CourseEditor';

function FullPageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50">
      <div className="flex items-center gap-3 text-ink-400">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        Loading…
      </div>
    </div>
  );
}

// Everything inside the app shell requires authentication.
function AppShell() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
}

// Redirect authenticated users away from the auth pages.
function AuthOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      {/* Public auth pages (no navbar, full screen) */}
      <Route path="/login" element={<AuthOnly><Login /></AuthOnly>} />
      <Route path="/register" element={<AuthOnly><Register /></AuthOnly>} />

      {/* Authenticated app */}
      <Route element={<AppShell />}>
        <Route path="/" element={<Catalog />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/learn/:courseId" element={<LessonPlayer />} />
        <Route path="/my-learning" element={<MyLearning />} />
        <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
        <Route path="/admin/courses/:id" element={<AdminOnly><CourseEditor /></AdminOnly>} />
        <Route path="*" element={<div className="py-20 text-center text-ink-400">Page not found</div>} />
      </Route>
    </Routes>
  );
}
