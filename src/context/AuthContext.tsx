'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  organizationId?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'azure') => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key for demo user session
const USER_STORAGE_KEY = 'koenig_learner_user';

// Transform Supabase user to our User type
function transformUser(supabaseUser: SupabaseUser | null, profile?: Record<string, unknown>): User | null {
  if (!supabaseUser) return null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    firstName: (profile?.first_name as string) || supabaseUser.user_metadata?.first_name || supabaseUser.email?.split('@')[0] || '',
    lastName: (profile?.last_name as string) || supabaseUser.user_metadata?.last_name || '',
    profilePictureUrl: (profile?.avatar_url as string) || supabaseUser.user_metadata?.avatar_url,
    organizationId: profile?.company_id as string,
    role: profile?.role as string || 'learner',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from database
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*, company:companies(name, slug)')
        .eq('id', userId)
        .single();
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      console.log('[Auth] initAuth called, isSupabaseConfigured:', isSupabaseConfigured());

      // Always check localStorage first for demo user (works even with Supabase configured)
      try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        console.log('[Auth] Stored user from localStorage:', storedUser);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Check if it's a demo user (id starts with 'demo')
          if (parsedUser.id?.startsWith('demo')) {
            console.log('[Auth] Found demo user, setting user state');
            setUser(parsedUser);
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('[Auth] Error checking localStorage:', error);
      }

      if (!isSupabaseConfigured()) {
        console.log('[Auth] Supabase not configured, demo mode only');
        setIsLoading(false);
        return;
      }

      // Real Supabase mode
      try {
        console.log('[Auth] Checking Supabase session...');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('[Auth] Current session:', currentSession?.user?.email || 'none');
        setSession(currentSession);

        if (currentSession?.user) {
          const profile = await fetchUserProfile(currentSession.user.id);
          setUser(transformUser(currentSession.user, profile));
        }
      } catch (error) {
        console.error('[Auth] Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);

      if (event === 'SIGNED_IN' && newSession?.user) {
        const profile = await fetchUserProfile(newSession.user.id);
        setUser(transformUser(newSession.user, profile));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Login with email/password
  const login = useCallback(async (email: string, password: string) => {
    console.log('[Auth] login called for:', email);
    console.log('[Auth] isSupabaseConfigured:', isSupabaseConfigured());

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.log('[Auth] Supabase not configured, throwing error');
      throw new Error('Supabase is not configured. Please use "Enter Demo Mode" to explore the app.');
    }

    try {
      console.log('[Auth] Calling Supabase signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[Auth] Supabase login response:', { data, error });

      if (error) {
        console.error('[Auth] Supabase login error:', error.message, error);
        // Handle specific error types - check for known errors first
        if (error.message?.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        }
        if (error.message?.includes('Email not confirmed')) {
          throw new Error('Please verify your email before logging in. Check your inbox for a confirmation link.');
        }
        // For any other error, show the actual error message for debugging
        throw new Error(error.message || 'Login failed. Please try again.');
      }

      if (!data.session || !data.user) {
        throw new Error('Login succeeded but no session was created. Please try again.');
      }

      console.log('[Auth] Login successful, user:', data.user.email);
    } catch (err) {
      console.error('[Auth] Login catch block:', err);
      // Re-throw if already an Error with message
      if (err instanceof Error) {
        // Check for network-specific errors at the catch level
        const errorMsg = err.message.toLowerCase();
        if (errorMsg === 'load failed' ||
            errorMsg.includes('failed to fetch') ||
            errorMsg.includes('networkerror') ||
            errorMsg.includes('network request failed') ||
            errorMsg.includes('cors')) {
          throw new Error('Unable to connect to server. Please check your internet connection and try again.');
        }
        throw err;
      }
      throw new Error('Login failed. Please try again.');
    }
  }, []);

  // Login as demo user (always works, uses localStorage - bypasses Supabase completely)
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

      // Store in localStorage first
      console.log('[Auth] Storing demo user in localStorage...');
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));

      // Verify it was stored
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      console.log('[Auth] Verified localStorage:', stored);

      // Set user state
      setUser(mockUser);
      console.log('[Auth] Demo user set successfully:', mockUser);

      // Return a promise that resolves after a tick to ensure state is set
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.error('[Auth] Error in loginAsDemo:', err);
      throw new Error('Failed to enter demo mode. Please try again.');
    }
  }, []);

  // Login with OAuth
  const loginWithOAuth = useCallback(async (provider: 'google' | 'azure') => {
    // Note: OAuth needs to be configured in Supabase Dashboard
    // Go to Authentication > Providers > Enable Google/Azure
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  }, []);

  // Sign up with email/password
  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: { firstName?: string; lastName?: string }
  ) => {
    // Check if Supabase is configured
    console.log('[Auth] isSupabaseConfigured:', isSupabaseConfigured());

    if (!isSupabaseConfigured()) {
      console.log('[Auth] Demo mode - creating mock user');
      // Demo mode - create a mock user and auto-login
      const mockUser: User = {
        id: `demo-${Date.now()}`,
        email: email,
        firstName: metadata?.firstName || '',
        lastName: metadata?.lastName || '',
        organizationId: '11111111-1111-1111-1111-111111111111',
        role: 'learner',
      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      return;
    }

    try {
      console.log('[Auth] Calling Supabase signUp...');
      // Sign up the user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: metadata?.firstName,
            last_name: metadata?.lastName,
          },
        },
      });

      console.log('[Auth] Supabase signUp response:', { data, error });

      if (error) {
        console.error('[Auth] Supabase error:', error.message, error);
        // Handle specific error types
        if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Load failed')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
        throw error;
      }

      // If user was created successfully, create a profile in public.users
      if (data.user) {
        try {
          await supabase.from('users').insert({
            id: data.user.id,
            email: email,
            first_name: metadata?.firstName || '',
            last_name: metadata?.lastName || '',
            role: 'learner',
            status: 'active',
            company_id: '11111111-1111-1111-1111-111111111111', // Default to Koenig
          });
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
          // Profile creation failure shouldn't block sign-up
        }

        // Auto sign-in after sign-up (if email confirmation is disabled in Supabase)
        if (data.session) {
          setSession(data.session);
          const profile = await fetchUserProfile(data.user.id);
          setUser(transformUser(data.user, profile));
        }
      }
    } catch (err) {
      // Convert generic errors to user-friendly messages
      if (err instanceof Error) {
        if (err.message === 'Load failed' || err.message?.includes('fetch')) {
          throw new Error('Unable to connect to server. Please check your internet connection and try again.');
        }
        throw err;
      }
      throw new Error('Sign up failed. Please try again.');
    }
  }, [fetchUserProfile]);

  // Logout
  const logout = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      window.location.href = '/login';
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
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
        session,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginAsDemo,
        loginWithOAuth,
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
