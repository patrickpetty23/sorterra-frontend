import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  useEffect(() => {
    authApi.restoreSession()
      .then(setUser)
      .catch(() => {
        // Session restoration failed — clear stale auth state
        authApi.logout();
      })
      .finally(() => setLoading(false));
  }, []);

  // Wire up 401 auto-logout
  useEffect(() => {
    apiClient.onUnauthorized = () => {
      logout();
    };
    return () => { apiClient.onUnauthorized = null; };
  }, [logout]);

  const login = async (credentials) => {
    const user = await authApi.login(credentials);
    setUser(user);
    return user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
