import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import ThemeToggle from './components/ThemeToggle';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { startKeepAlive, stopKeepAlive, wakeUpBackend } from './utils/keepAlive';

// Lazy load heavy components for code splitting
const LandingPage = lazy(() => import('./components/LandingPage'));
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const Profile = lazy(() => import('./components/Profile'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

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
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mb-4"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-gray-600 dark:text-gray-400 text-sm"
      >
        Loading...
      </motion.p>
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

  // Wake up backend when app loads and start keep-alive
  useEffect(() => {
    // Wake up backend immediately when app loads
    wakeUpBackend().then((awake) => {
      if (awake) {
        // Start keep-alive service to prevent backend from sleeping
        startKeepAlive();
      }
    });

    // Cleanup: stop keep-alive when component unmounts
    return () => {
      stopKeepAlive();
    };
  }, []);

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <ThemeToggle />
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Landing page - redirect to dashboard if logged in */}
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to={user.is_admin ? "/admin" : "/dashboard"} replace />
                ) : (
                  <LandingPage />
                )
              }
            />
            {/* Auth pages - redirect to dashboard if already logged in */}
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to={user.is_admin ? "/admin" : "/dashboard"} replace />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/register"
              element={
                user ? (
                  <Navigate to={user.is_admin ? "/admin" : "/dashboard"} replace />
                ) : (
                  <Register />
                )
              }
            />
            <Route
              path="/admin-login"
              element={
                user && user.is_admin ? (
                  <Navigate to="/admin" replace />
                ) : user ? (
                  <Navigate to="/" replace />
                ) : (
                  <AdminLogin />
                )
              }
            />
            <Route
              path="/forgot-password"
              element={
                user ? (
                  <Navigate to={user.is_admin ? "/admin" : "/dashboard"} replace />
                ) : (
                  <ForgotPassword />
                )
              }
            />
            {/* Protected routes - redirect to landing page if not logged in */}
            <Route
              path="/dashboard"
              element={
                user && !user.is_admin ? (
                  <StudentDashboard />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/profile"
              element={
                user && !user.is_admin ? (
                  <Profile />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/admin"
              element={
                user && user.is_admin ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            {/* Catch all - redirect to landing page */}
            <Route
              path="*"
              element={
                user ? (
                  <Navigate to={user.is_admin ? "/admin" : "/dashboard"} replace />
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
          <Router>
            <AppContent />
          </Router>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
