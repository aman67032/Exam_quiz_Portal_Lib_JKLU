import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loader from './Loader';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route component for admin-only pages
 * - Redirects to /admin-login if user is not logged in
 * - Redirects to /home if user is logged in but not an admin
 * - Allows access if user is an admin
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loader while checking authentication
  if (loading) {
    return <Loader fullScreen />;
  }

  // If not logged in, redirect to admin login
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  // If logged in but not admin, redirect to home
  if (!user.is_admin) {
    return <Navigate to="/home" replace />;
  }

  // User is admin, allow access
  return <>{children}</>;
};

export default AdminRoute;

