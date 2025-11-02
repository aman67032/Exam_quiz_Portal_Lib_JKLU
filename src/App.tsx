import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import OTPVerification from './components/OTPVerification';
import AdminLogin from './components/AdminLogin';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import PublicHome from './components/PublicHome';
import ThemeToggle from './components/ThemeToggle';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <ThemeToggle />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to={user.is_admin ? "/admin" : "/dashboard"} />
              ) : (
                <OTPVerification />
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
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
