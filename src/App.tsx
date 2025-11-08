import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';
import ThemeToggle from './components/ThemeToggle';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Lazy load heavy components for code splitting
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const Profile = lazy(() => import('./components/Profile'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const PublicHome = lazy(() => import('./components/PublicHome'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"
    />
  </div>
);

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <ThemeToggle />
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to={user.is_admin ? "/admin" : "/dashboard"} />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/register"
              element={
                user ? (
                  <Navigate to={user.is_admin ? "/admin" : "/dashboard"} />
                ) : (
                  <Register />
                )
              }
            />
            <Route
              path="/admin-login"
              element={
                user && user.is_admin ? (
                  <Navigate to="/admin" />
                ) : (
                  <AdminLogin />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                user && !user.is_admin ? (
                  <StudentDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/profile"
              element={
                user && !user.is_admin ? (
                  <Profile />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/admin"
              element={
                user && user.is_admin ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/admin-login" />
                )
              }
            />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Router>
            <AppContent />
          </Router>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
