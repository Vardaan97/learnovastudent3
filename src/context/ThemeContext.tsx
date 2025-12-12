'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

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

// Generate a dynamic theme for unknown companies
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

  // Initialize theme from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get company slug from URL path (e.g., student.learnova.training/rt)
    const urlSlug = getCompanySlugFromUrl();

    // Check localStorage as fallback
    const savedCompany = localStorage.getItem('company_theme');

    const effectiveSlug = urlSlug || savedCompany || null;

    if (effectiveSlug) {
      setCompanySlug(effectiveSlug);

      // Use predefined theme if available, otherwise generate dynamic theme
      if (companyThemes[effectiveSlug]) {
        setTheme(companyThemes[effectiveSlug]);
      } else {
        setTheme(generateDynamicTheme(effectiveSlug));
      }

      // Save to localStorage for persistence
      localStorage.setItem('company_theme', effectiveSlug);
      console.log('[Theme] Company detected from URL:', effectiveSlug);
    } else {
      // Default to PWC theme for demo purposes
      setTheme(pwcTheme);
      setCompanySlug('pwc');
      console.log('[Theme] No company detected, using default PWC theme');
    }

    setIsInitialized(true);
  }, []);

  // Apply CSS variables when theme changes
  useEffect(() => {
    if (!isInitialized) return;

    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
    document.documentElement.style.setProperty('--accent-color', theme.accentColor);
  }, [theme, isInitialized]);

  const setCompany = useCallback((companyId: string) => {
    setCompanySlug(companyId);

    if (companyThemes[companyId]) {
      setTheme(companyThemes[companyId]);
    } else {
      setTheme(generateDynamicTheme(companyId));
    }

    localStorage.setItem('company_theme', companyId);
  }, []);

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
