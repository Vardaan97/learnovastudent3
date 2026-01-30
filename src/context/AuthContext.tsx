'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useIsConvexConfigured } from '@/providers/ConvexClientProvider';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  organizationId?: string;
  role?: string;
  // Course access control for demo accounts
  allowedCourses?: string[]; // Array of course codes, undefined = all courses
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key for user session
const USER_STORAGE_KEY = 'koenig_learner_user';

// Demo accounts with course access control
// Password for all demo accounts: Demo123!
const DEMO_ACCOUNTS: Record<string, User> = {
  'demo-python@koenig.com': {
    id: 'user-demo-python',
    email: 'demo-python@koenig.com',
    firstName: 'Python',
    lastName: 'Learner',
    organizationId: '11111111-1111-1111-1111-111111111111',
    role: 'learner',
    allowedCourses: ['55284A'], // Python course only
  },
  'demo-mongo@koenig.com': {
    id: 'user-demo-mongo',
    email: 'demo-mongo@koenig.com',
    firstName: 'MongoDB',
    lastName: 'Learner',
    organizationId: '11111111-1111-1111-1111-111111111111',
    role: 'learner',
    allowedCourses: ['932'], // MongoDB course only
  },
  'demo-all@koenig.com': {
    id: 'user-demo-all',
    email: 'demo-all@koenig.com',
    firstName: 'Full Access',
    lastName: 'Learner',
    organizationId: '11111111-1111-1111-1111-111111111111',
    role: 'learner',
    // No allowedCourses means access to all courses
  },
  // Koenig Solutions demo accounts
  'demo@koenig-solutions.com': {
    id: 'user-demo-kspl-python',
    email: 'demo@koenig-solutions.com',
    firstName: 'Python',
    lastName: 'Learner',
    organizationId: '22222222-2222-2222-2222-222222222222',
    role: 'learner',
    allowedCourses: ['55284A'], // Python course only
  },
  'demo2@koenig-solutions.com': {
    id: 'user-demo-kspl-all',
    email: 'demo2@koenig-solutions.com',
    firstName: 'Full Access',
    lastName: 'Learner',
    organizationId: '22222222-2222-2222-2222-222222222222',
    role: 'learner',
    // No allowedCourses means access to all courses
  },
  // Wargaming demo accounts
  'wargaming@koenig-solutions.com': {
    id: 'user-wargaming-python',
    email: 'wargaming@koenig-solutions.com',
    firstName: 'Wargaming',
    lastName: '',
    organizationId: '33333333-3333-3333-3333-333333333333',
    role: 'learner',
    allowedCourses: ['55284A'], // Python course only
  },
  'demo1@koenig-solutions.com': {
    id: 'user-wargaming-all',
    email: 'demo1@koenig-solutions.com',
    firstName: 'Wargaming',
    lastName: '',
    organizationId: '33333333-3333-3333-3333-333333333333',
    role: 'learner',
    // No allowedCourses means access to all courses
  },
};

// Demo passwords
const DEMO_PASSWORD = 'Demo123!';
const WARGAMING_PASSWORD = 'Wargaming2026!';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if Convex is configured (demo mode if not)
  const isConvexConfigured = useIsConvexConfigured();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      console.log('[Auth] initAuth called, isConvexConfigured:', isConvexConfigured);

      // Check localStorage for user data
      try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        console.log('[Auth] Stored user from localStorage:', storedUser ? 'found' : 'not found');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.id && parsedUser.email) {
            console.log('[Auth] Found valid user in localStorage, restoring session');
            setUser(parsedUser);
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('[Auth] Error checking localStorage:', error);
      }

      console.log('[Auth] No stored session found');
      setIsLoading(false);
    };

    initAuth();
  }, [isConvexConfigured]);

  // Login with email/password
  const login = useCallback(async (email: string, password: string) => {
    console.log('[Auth] login called for:', email);
    console.log('[Auth] isConvexConfigured:', isConvexConfigured);

    // Check for demo accounts first (works regardless of Convex configuration)
    const normalizedEmail = email.toLowerCase().trim();
    const demoUser = DEMO_ACCOUNTS[normalizedEmail];
    if (demoUser) {
      console.log('[Auth] Demo account detected:', normalizedEmail);
      // Check if it's a Wargaming account (uses different password)
      const isWargamingAccount = normalizedEmail.includes('wargaming') || normalizedEmail === 'demo1@koenig-solutions.com';
      const expectedPassword = isWargamingAccount ? WARGAMING_PASSWORD : DEMO_PASSWORD;

      if (password === expectedPassword) {
        console.log('[Auth] Password correct, logging in as:', demoUser.firstName);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(demoUser));
        setUser(demoUser);

        // Track login activity
        try {
          fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: demoUser.email,
              action: 'login',
              timestamp: new Date().toISOString(),
              userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            }),
          }).catch(() => {}); // Fire and forget
        } catch {}

        return;
      } else {
        console.log('[Auth] Invalid password for account');
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
    }

    // For now, without Convex configured, only demo accounts work
    // When Convex is configured, we can add real auth here
    if (isConvexConfigured) {
      console.log('[Auth] Convex configured but dynamic import needed for mutations');
      // Note: To enable Convex auth, add NEXT_PUBLIC_CONVEX_URL env var
      // and implement dynamic mutation loading
    }

    // No backend configured and not a demo account
    console.log('[Auth] Not a demo account and Convex not configured');
    throw new Error('Invalid email or password. Please check your credentials and try again.');
  }, [isConvexConfigured]);

  // Login as demo user (always works, uses localStorage)
  const loginAsDemo = useCallback(async () => {
    console.log('[Auth] loginAsDemo called');
    try {
      const mockUser: User = {
        id: 'demo-user-001',
        email: 'demo@koenig.com',
        firstName: 'Demo',
        lastName: 'User',
        organizationId: '11111111-1111-1111-1111-111111111111',
        role: 'learner',
      };

      // Store in localStorage
      console.log('[Auth] Storing demo user in localStorage...');
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));

      // Verify storage
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      console.log('[Auth] Verified localStorage:', stored ? 'success' : 'failed');

      // Set user state
      setUser(mockUser);
      console.log('[Auth] Demo user set successfully:', mockUser);

      // Wait a tick to ensure state is set
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.error('[Auth] Error in loginAsDemo:', err);
      throw new Error('Failed to enter demo mode. Please try again.');
    }
  }, []);

  // Sign up with email/password
  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: { firstName?: string; lastName?: string }
  ) => {
    console.log('[Auth] signUp called for:', email);

    // Demo mode - create a mock user and auto-login
    console.log('[Auth] Demo mode - creating mock user');
    const mockUser: User = {
      id: `user-${email.replace(/[^a-zA-Z0-9]/g, '-')}`,
      email: email,
      firstName: metadata?.firstName || email.split('@')[0],
      lastName: metadata?.lastName || '',
      organizationId: '11111111-1111-1111-1111-111111111111',
      role: 'learner',
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
  }, []);

  // Logout
  const logout = useCallback(async () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('koenig_last_company');
    setUser(null);
    window.location.href = '/login';
  }, []);

  // Expose setAuthUser on window for callback page (legacy support)
  useEffect(() => {
    (window as unknown as { __setAuthUser?: (user: User) => void }).__setAuthUser = (newUser: User) => {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
    };
    return () => {
      delete (window as unknown as { __setAuthUser?: (user: User) => void }).__setAuthUser;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginAsDemo,
        logout,
        signUp,
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
