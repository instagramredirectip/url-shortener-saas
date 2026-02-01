import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Use the hook we created

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // Optional: You can put a Spinner here if you want
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    // If not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If logged in, show the page
  return children;
};

export default ProtectedRoute;