import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import * as authService from '../services/auth';

interface AuthContextType {
  user: authService.User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredUser(): authService.User | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem('user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<authService.User | null>(() => getStoredUser());

  const login = (email: string, password: string) => {
    const loggedInUser = authService.login(email, password);
    setUser(loggedInUser);
    if (loggedInUser && typeof window !== 'undefined') {
      window.localStorage.setItem('user', JSON.stringify(loggedInUser));
    }
    return !!loggedInUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
} 