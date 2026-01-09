import { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in when the app starts
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  // Wrapper for Login
  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    setUser(data.user);
    return data;
  };

  // Wrapper for Register
  const register = async (email, password) => {
    const data = await authService.register({ email, password });
    setUser(data.user);
    return data;
  };

  // Wrapper for Logout
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};