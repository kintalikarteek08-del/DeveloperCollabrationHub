import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('devcollab_token') || null);
  const [loading, setLoading] = useState(true);

  // Load current user from backend if token exists
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.data);
          localStorage.setItem('devcollab_user', JSON.stringify(res.data.data));
        }
      } catch (err) {
        console.error('[AuthContext] Failed to fetch current user', err);
        setToken(null);
        setUser(null);
        localStorage.removeItem('devcollab_token');
        localStorage.removeItem('devcollab_user');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const data = res.data.data;
      localStorage.setItem('devcollab_token', data.token);
      localStorage.setItem('devcollab_user', JSON.stringify(data));
      setToken(data.token);
      setUser(data);
      return data;
    }
  };

  // Register handler
  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      const data = res.data.data;
      localStorage.setItem('devcollab_token', data.token);
      localStorage.setItem('devcollab_user', JSON.stringify(data));
      setToken(data.token);
      setUser(data);
      return data;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('devcollab_token');
      localStorage.removeItem('devcollab_user');
      setToken(null);
      setUser(null);
    }
  };

  // Update profile in state
  const updateUserProfile = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
    localStorage.setItem('devcollab_user', JSON.stringify({ ...user, ...updatedData }));
  };

  // Direct login setter (for password reset, external auth)
  const handleAuthSuccess = (authData) => {
    localStorage.setItem('devcollab_token', authData.token);
    localStorage.setItem('devcollab_user', JSON.stringify(authData));
    setToken(authData.token);
    setUser(authData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateUserProfile,
        handleAuthSuccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
