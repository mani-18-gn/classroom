import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { apiRequest, setAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  demoLogin: (role: Role) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await apiRequest<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch (err) {
      console.error('Failed to restore session:', err);
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identifier: string, pass: string) => {
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password: pass }),
      });
      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role: Role) => {
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, demoLogin, logout, refreshUser }}>
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
