import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import ThemeToggle from './components/ThemeToggle';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Loader from './components/Loader';
import AdminRoute from './components/AdminRoute';

// Lazy load heavy components for code splitting
const LandingPage = lazy(() => import('./components/LandingPage'));
const Login = lazy(() => import('./components/Login'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const Register = lazy(() => import('./components/Register'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const Profile = lazy(() => import('./components/Profile'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const PublicHome = lazy(() => import('./components/PublicHome'));
const CodingHourPage = lazy(() => import('./components/CodingHourPage'));
const ChallengePage = lazy(() => import('./components/ChallengePage'));
const HostDashboard = lazy(() => import('./components/HostDashboard'));

// Loading fallback component with backend wake-up message
const LoadingFallback = () => {
  const [showWakeMessage, setShowWakeMessage] = useState(false);

  useEffect(() => {
    // Show wake-up message after 2 seconds (if still loading, backend might be waking)
    const timer = setTimeout(() => {
      setShowWakeMessage(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/60 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Loader fullScreen />
      {showWakeMessage && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-purple-600 dark:text-purple-400 text-xs mt-2 max-w-md text-center px-4"
        >
          ⏳ Backend is starting up. This may take 30-60 seconds on first load...
        </motion.p>
      )}
    </div>
  );
};

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
            {/* Landing page - always accessible */}
            <Route
              path="/"
              element={<LandingPage />}
            />
            {/* Public home - accessible to everyone */}
            <Route
              path="/home"
              element={<PublicHome />}
            />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to={user.is_admin ? "/admin" : user.is_sub_admin ? "/host-dashboard" : "/home"} replace />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/register"
              element={
                user ? (
                  <Navigate to={user.is_admin ? "/admin" : user.is_sub_admin ? "/host-dashboard" : "/home"} replace />
                ) : (
                  <Register />
                )
              }
            />
            <Route
              path="/admin-login"
              element={
                user ? (
                  <Navigate to={user.is_admin ? "/admin" : user.is_sub_admin ? "/host-dashboard" : "/home"} replace />
                ) : (
                  <AdminLogin />
                )
              }
            />
            <Route
              path="/forgot-password"
              element={
                user ? (
                  <Navigate to={user.is_admin ? "/admin" : user.is_sub_admin ? "/host-dashboard" : "/home"} replace />
                ) : (
                  <ForgotPassword />
                )
              }
            />
            {/* Protected routes - redirect to home if not logged in (login blocked for testing) */}
            <Route
              path="/dashboard"
              element={
                user && !user.is_admin && !user.is_sub_admin ? (
                  <StudentDashboard />
                ) : (
                  <Navigate to="/home" replace />
                )
              }
            />
            <Route
              path="/profile"
              element={
                user && !user.is_admin && !user.is_sub_admin ? (
                  <Profile />
                ) : (
                  <Navigate to="/home" replace />
                )
              }
            />
            {/* Host Dashboard - for Sub Admins */}
            <Route
              path="/host-dashboard"
              element={
                user && (user.is_admin || user.is_sub_admin) ? (
                  <HostDashboard />
                ) : (
                  <Navigate to="/home" replace />
                )
              }
            />
            {/* Coding Hour Routes - Publicly Accessible */}
            <Route
              path="/coding-hour/:courseId"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <CodingHourPage />
                </Suspense>
              }
            />
            <Route
              path="/coding-hour/:courseId/challenge/:challengeId"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <ChallengePage />
                </Suspense>
              }
            />
            {/* Admin route - protected with AdminRoute component */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            {/* Also protect any /admin/* sub-routes */}
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            {/* Catch all - redirect to landing page */}
            <Route
              path="*"
              element={
                user ? (
                  <Navigate to={user.is_admin ? "/admin" : user.is_sub_admin ? "/host-dashboard" : "/home"} replace />
                ) : (
                  <Navigate to="/" replace />
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
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppContent />
          </Router>
        </ErrorBoundary>
      </AuthProvider>
      <Analytics />
    </ThemeProvider>
  );
}

export default App;
