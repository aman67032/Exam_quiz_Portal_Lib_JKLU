import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Loader from '@/components/ui/Loader';
import AdminRoute from '@/components/guards/AdminRoute';
import MaintenanceMode from '@/components/ui/MaintenanceMode';

// Lazy load heavy route views organized by domain
const LandingPage = lazy(() => import('@/views/public/LandingPage'));
const PublicHome = lazy(() => import('@/views/public/PublicHome'));
const Login = lazy(() => import('@/views/auth/Login'));
const AdminLogin = lazy(() => import('@/views/auth/AdminLogin'));
const Register = lazy(() => import('@/views/auth/Register'));
const StudentDashboard = lazy(() => import('@/views/student/StudentDashboard'));
const Profile = lazy(() => import('@/views/student/Profile'));
const AdminDashboard = lazy(() => import('@/views/admin/AdminDashboard'));

// Loading fallback component with editorial aesthetic
const LoadingFallback = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] dark:bg-[#0A0A0C]">
      <Loader fullScreen />
    </div>
  );
};

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  const MAINTENANCE_MODE = false;

  if (MAINTENANCE_MODE) {
    return <MaintenanceMode />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0A0A0C] text-[#0A0A0C] dark:text-[#F5F4F0] transition-colors duration-300">
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
                  <Navigate to={user.is_admin ? "/admin" : user.admin_role === 'coding_ta' ? "/admin/coding-hour" : user.is_sub_admin ? "/admin/contests" : "/home"} replace />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/register"
              element={
                user ? (
                  <Navigate to={user.is_admin ? "/admin" : user.admin_role === 'coding_ta' ? "/admin/coding-hour" : user.is_sub_admin ? "/admin/contests" : "/home"} replace />
                ) : (
                  <Register />
                )
              }
            />
            <Route
              path="/admin-login"
              element={
                user ? (
                  <Navigate to={user.is_admin ? "/admin" : user.admin_role === 'coding_ta' ? "/admin/coding-hour" : user.is_sub_admin ? "/admin/contests" : "/home"} replace />
                ) : (
                  <AdminLogin />
                )
              }
            />
            <Route
              path="/forgot-password"
              element={<Navigate to="/login" replace />}
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
                  <Navigate to={user.is_admin ? "/admin" : "/home"} replace />
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
