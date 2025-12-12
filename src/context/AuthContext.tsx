'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  organizationId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key for user session
const USER_STORAGE_KEY = 'koenig_learner_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Login function - redirects to WorkOS
  const login = useCallback(() => {
    // Check if WorkOS credentials are configured
    const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI || `${window.location.origin}/api/auth/callback`;

    if (clientId) {
      // Redirect to WorkOS OAuth
      const authUrl = `https://api.workos.com/sso/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `provider=authkit`;

      window.location.href = authUrl;
    } else {
      // Demo mode - simulate login with mock user
      const mockUser: User = {
        id: 'demo-user-001',
        email: 'vardaan.aggarwal@example.com',
        firstName: 'Vardaan',
        lastName: 'Aggarwal',
        organizationId: 'koenig-solutions',
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);

    // If using WorkOS, could redirect to their logout URL
    // For now, just redirect to login page
    window.location.href = '/login';
  }, []);

  // Set user from OAuth callback
  const setAuthUser = useCallback((newUser: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  // Expose setAuthUser on window for callback page
  useEffect(() => {
    (window as unknown as { __setAuthUser?: (user: User) => void }).__setAuthUser = setAuthUser;
    return () => {
      delete (window as unknown as { __setAuthUser?: (user: User) => void }).__setAuthUser;
    };
  }, [setAuthUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
