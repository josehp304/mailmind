'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
  picture?: string;
  gmailAddress: string;
}

interface SessionContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/session');
      const data = await response.json();
      
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    window.location.href = '/api/oauth';
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
      // Optionally redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const value: SessionContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}