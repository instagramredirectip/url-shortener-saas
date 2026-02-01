import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  // If not logged in, go to Login
  if (!user) return <Navigate to="/login" />;

  // If logged in but NOT admin, go to Dashboard
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // If Admin, show the page
  return children;
};

export default AdminRoute;