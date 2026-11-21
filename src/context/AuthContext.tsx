import React, { createContext, useCallback, useContext, useState } from 'react';
import { apiRequest, setApiToken } from '../lib/api.ts';
import type { Language, UserProfile } from '../types/playroom.ts';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (input: {
    username: string;
    displayName: string;
    email: string;
    password: string;
    preferredLanguage: Language;
  }) => Promise<{ user: UserProfile; emailVerificationRequired: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  setUserState: (u: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ user: UserProfile; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setApiToken(data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (input: {
      username: string;
      displayName: string;
      email: string;
      password: string;
      preferredLanguage: Language;
    }) => {
      setIsLoading(true);
      try {
        const data = await apiRequest<{
          user: UserProfile;
          token: string;
          emailVerificationRequired: boolean;
        }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        setApiToken(data.token);
        setToken(data.token);
        setUser(data.user);
        return {
          user: data.user,
          emailVerificationRequired: data.emailVerificationRequired,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      if (token) {
        await apiRequest('/auth/logout', { method: 'POST' });
      }
    } catch {
      // Ignore logout network errors
    } finally {
      setApiToken(null);
      setToken(null);
      setUser(null);
    }
  }, [token]);

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    try {
      const data = await apiRequest<{ user: UserProfile }>('/auth/me');
      setUser(data.user);
      return data.user;
    } catch {
      return null;
    }
  }, [token]);

  const isAdmin = Boolean(user?.role && ['moderator', 'admin', 'super_admin'].includes(user.role));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        setUserState: setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
