import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
      setUser(data);
      return { success: true };
    } catch (error) {
      const detail = error.response?.data?.detail;
      let message = 'Login failed';
      if (typeof detail === 'string') message = detail;
      else if (Array.isArray(detail)) message = detail.map(e => e.msg || JSON.stringify(e)).join(' ');
      return { success: false, error: message };
    }
  };

  const register = async (email, password, name, phone) => {
    try {
      const { data } = await axios.post(`${API}/auth/register`, { email, password, name, phone }, { withCredentials: true });
      setUser(data);
      return { success: true };
    } catch (error) {
      const detail = error.response?.data?.detail;
      let message = 'Registration failed';
      if (typeof detail === 'string') message = detail;
      else if (Array.isArray(detail)) message = detail.map(e => e.msg || JSON.stringify(e)).join(' ');
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
