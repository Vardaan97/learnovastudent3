'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { companyService, isSupabaseConfigured } from '@/lib/supabase';

export interface CompanyTheme {
  id: string;
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerBg: string;
  buttonStyle: 'rounded' | 'pill' | 'square';
  welcomeMessage: string;
  supportEmail: string;
  customBranding: boolean;
  // Feature flags from Sales Portal settings
  features?: {
    courseContent?: boolean;
    quizzes?: boolean;
    qubits?: boolean;
    certificates?: boolean;
    aiAssistant?: boolean;
    studyGroups?: boolean;
    forum?: boolean;
    liveSessions?: boolean;
    analytics?: boolean;
    gamification?: boolean;
    flashcards?: boolean;
    mindMaps?: boolean;
    focusMode?: boolean;
    calendar?: boolean;
    examSimulator?: boolean;
    weakAreaDrills?: boolean;
    progressSharing?: boolean;
    leaderboards?: boolean;
    customReporting?: boolean;
  };
}

const defaultTheme: CompanyTheme = {
  id: 'koenig',
  name: 'Koenig Solutions',
  logo: '/koenig-logo.png',
  primaryColor: '#0891b2', // cyan-600
  secondaryColor: '#0e7490', // cyan-700
  accentColor: '#06b6d4', // cyan-500
  headerBg: '#ffffff',
  buttonStyle: 'pill',
  welcomeMessage: 'Welcome to Koenig Learning Portal',
  supportEmail: 'support@koenig.com',
  customBranding: false,
};

const pwcTheme: CompanyTheme = {
  id: 'pwc',
  name: 'PwC',
  logo: '/pwc-logo.png',
  primaryColor: '#e85d04', // PwC Orange
  secondaryColor: '#d00000', // PwC Red
  accentColor: '#ffba08', // PwC Yellow
  headerBg: '#1a1a1a',
  buttonStyle: 'square',
  welcomeMessage: 'Welcome to PwC Learning Academy',
  supportEmail: 'learning@pwc.com',
  customBranding: true,
};

// Predefined themes for known companies
const companyThemes: Record<string, CompanyTheme> = {
  koenig: defaultTheme,
  pwc: pwcTheme,
};

// Demo companies that should show pre-populated mock data
// New companies created in Sales Portal should NOT be in this list
export const DEMO_COMPANIES = ['pwc', 'koenig', 'demo'] as const;

// Check if a company slug is a demo company (should show mock data)
export function isDemoCompany(slug: string | null): boolean {
  if (!slug) return false;
  return DEMO_COMPANIES.includes(slug.toLowerCase() as typeof DEMO_COMPANIES[number]);
}

// Generate a dynamic theme for unknown companies (fallback)
function generateDynamicTheme(slug: string): CompanyTheme {
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);
  return {
    id: slug,
    name: `${name} Learning Portal`,
    logo: `/logos/${slug}.png`,
    primaryColor: '#0891b2',
    secondaryColor: '#0e7490',
    accentColor: '#06b6d4',
    headerBg: '#ffffff',
    buttonStyle: 'pill',
    welcomeMessage: `Welcome to ${name} Learning Portal`,
    supportEmail: `support@${slug}.com`,
    customBranding: true,
    features: {
      courseContent: true,
      quizzes: true,
      qubits: true,
      certificates: true,
      aiAssistant: true,
      gamification: true,
      flashcards: true,
      focusMode: true,
      calendar: true,
    },
  };
}

// Convert Supabase company data to CompanyTheme
function companyToTheme(company: Record<string, unknown>): CompanyTheme {
  const branding = (company.branding as Record<string, unknown>) || {};
  const features = (company.features as Record<string, boolean>) || {};

  return {
    id: company.slug as string || company.id as string,
    name: company.name as string || 'Learning Portal',
    logo: branding.logoUrl as string || `/logos/${company.slug}.png`,
    primaryColor: branding.primaryColor as string || '#0891b2',
    secondaryColor: branding.secondaryColor as string || '#0e7490',
    accentColor: branding.accentColor as string || '#06b6d4',
    headerBg: branding.headerBg as string || '#ffffff',
    buttonStyle: (branding.buttonStyle as 'rounded' | 'pill' | 'square') || 'pill',
    welcomeMessage: branding.welcomeTitle as string || `Welcome to ${company.name} Learning Portal`,
    supportEmail: company.support_email as string || `support@${company.slug}.com`,
    customBranding: true,
    features: {
      courseContent: features.courseContent !== false,
      quizzes: features.quizzes !== false,
      qubits: features.qubits !== false,
      certificates: features.certificates !== false,
      aiAssistant: features.aiAssistant !== false,
      studyGroups: features.studyGroups || false,
      forum: features.forum || false,
      liveSessions: features.liveSessions || false,
      analytics: features.analytics !== false,
      gamification: features.gamification !== false,
      flashcards: features.flashcards !== false,
      mindMaps: features.mindMaps || false,
      focusMode: features.focusMode !== false,
      calendar: features.calendar !== false,
      examSimulator: features.examSimulator || false,
      weakAreaDrills: features.weakAreaDrills || false,
      progressSharing: features.progressSharing || false,
      leaderboards: features.leaderboards || false,
      customReporting: features.customReporting || false,
    },
  };
}

// Extract company slug from URL path or query params
function getCompanySlugFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);

  // First check URL path: /slug or /slug/...
  // Example: student.learnova.training/rt
  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts.length > 0) {
    const potentialSlug = pathParts[0].toLowerCase();
    // Reserved routes that are not company slugs
    const reservedRoutes = ['login', 'logout', 'auth', 'api', '_next', 'static', 'images', 'favicon.ico'];
    if (!reservedRoutes.includes(potentialSlug)) {
      return potentialSlug;
    }
  }

  // Fallback to query param: ?company=rt
  const companyParam = searchParams.get('company');
  if (companyParam) {
    return companyParam.toLowerCase();
  }

  return null;
}

interface ThemeContextType {
  theme: CompanyTheme;
  companySlug: string | null;
  setCompany: (companyId: string) => void;
  availableThemes: CompanyTheme[];
  isCustomBranded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<CompanyTheme>(defaultTheme);
  const [companySlug, setCompanySlug] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load company theme from Supabase
  const loadCompanyFromSupabase = useCallback(async (slug: string): Promise<CompanyTheme | null> => {
    if (!isSupabaseConfigured()) {
      console.log('[Theme] Supabase not configured, skipping database lookup');
      return null;
    }

    try {
      const company = await companyService.getBySlug(slug);
      if (company) {
        console.log('[Theme] Loaded company from Supabase:', company.name);
        return companyToTheme(company);
      }
    } catch (error) {
      console.error('[Theme] Error loading company from Supabase:', error);
    }
    return null;
  }, []);

  // Initialize theme from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeTheme = async () => {
      // Get company slug from URL path (e.g., student.learnova.training/rt)
      const urlSlug = getCompanySlugFromUrl();

      // Check localStorage as fallback
      const savedCompany = localStorage.getItem('company_theme');

      const effectiveSlug = urlSlug || savedCompany || null;

      if (effectiveSlug) {
        setCompanySlug(effectiveSlug);

        // First check predefined themes
        if (companyThemes[effectiveSlug]) {
          setTheme(companyThemes[effectiveSlug]);
          console.log('[Theme] Using predefined theme:', effectiveSlug);
        } else {
          // Try to load from Supabase (for companies created in Sales Portal)
          const supabaseTheme = await loadCompanyFromSupabase(effectiveSlug);
          if (supabaseTheme) {
            setTheme(supabaseTheme);
            console.log('[Theme] Using Supabase theme:', effectiveSlug);
          } else {
            // Fallback to dynamically generated theme
            setTheme(generateDynamicTheme(effectiveSlug));
            console.log('[Theme] Using dynamic theme:', effectiveSlug);
          }
        }

        // Save to localStorage for persistence
        localStorage.setItem('company_theme', effectiveSlug);
      } else {
        // Default to PWC theme for demo purposes
        setTheme(pwcTheme);
        setCompanySlug('pwc');
        console.log('[Theme] No company detected, using default PWC theme');
      }

      setIsInitialized(true);
    };

    initializeTheme();
  }, [loadCompanyFromSupabase]);

  // Apply CSS variables when theme changes
  useEffect(() => {
    if (!isInitialized) return;

    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
    document.documentElement.style.setProperty('--accent-color', theme.accentColor);
  }, [theme, isInitialized]);

  const setCompany = useCallback(async (companyId: string) => {
    setCompanySlug(companyId);

    if (companyThemes[companyId]) {
      setTheme(companyThemes[companyId]);
    } else {
      // Try to load from Supabase first
      const supabaseTheme = await loadCompanyFromSupabase(companyId);
      if (supabaseTheme) {
        setTheme(supabaseTheme);
      } else {
        setTheme(generateDynamicTheme(companyId));
      }
    }

    localStorage.setItem('company_theme', companyId);
  }, [loadCompanyFromSupabase]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        companySlug,
        setCompany,
        availableThemes: Object.values(companyThemes),
        isCustomBranded: theme.customBranding,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
