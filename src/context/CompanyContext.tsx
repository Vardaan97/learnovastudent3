'use client';

/**
 * Company Context
 * ===============
 *
 * Manages company-specific configuration, branding, and features.
 * This context drives the multi-tenant customization of the portal.
 *
 * HANDOVER NOTES:
 * - Company data is loaded on app initialization
 * - Features can be toggled on/off per company
 * - Branding applies to UI colors, fonts, and messaging
 * - Sales team can customize via the admin portal
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Company,
  CompanyBranding,
  CompanyFeatures,
  CompanyIndustry,
  CompanySize,
} from '@/lib/db/schema';
import {
  COMPANY_PRESETS,
  getPresetById,
  getDefaultBranding,
  getFeaturesForTier,
  getContrastColor,
} from '@/lib/config/company-presets';

// ============================================================================
// TYPES
// ============================================================================

interface CompanyContextValue {
  // Company data
  company: Company | null;
  isLoading: boolean;
  error: string | null;

  // Branding helpers
  branding: CompanyBranding;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;

  // Feature checks
  features: CompanyFeatures;
  hasFeature: (feature: keyof CompanyFeatures) => boolean;
  isFeatureEnabled: (feature: string) => boolean;

  // Industry/size info
  industry: CompanyIndustry | null;
  companySize: CompanySize | null;
  subscriptionTier: 'starter' | 'professional' | 'enterprise';

  // Actions (for admin portal)
  updateBranding: (updates: Partial<CompanyBranding>) => void;
  updateFeatures: (updates: Partial<CompanyFeatures>) => void;
  loadPreset: (presetId: string) => void;
  resetToDefaults: () => void;

  // CSS variables helper
  getCSSVariables: () => Record<string, string>;

  // Custom messages
  welcomeTitle: string;
  welcomeSubtitle: string;
  loginMessage: string;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

// PWC is the default company for this build
const PWC_COMPANY: Company = {
  id: 'pwc-001',
  name: 'PricewaterhouseCoopers',
  slug: 'pwc',
  industry: 'consulting',
  size: 'enterprise',
  logo: '/logos/pwc-logo.png',
  favicon: '/favicons/pwc.ico',
  branding: {
    primaryColor: '#e85d04',
    secondaryColor: '#d00000',
    accentColor: '#ffba08',
    backgroundColor: '#fffcf2',
    headerBackground: '#ffffff',
    textColor: '#2b2d42',
    fontFamily: 'Georgia, serif',
    headingFont: 'Georgia, serif',
    buttonStyle: 'square',
    cardStyle: 'bordered',
    welcomeTitle: 'PwC Learning Academy',
    welcomeSubtitle: 'Building tomorrow\'s leaders through continuous learning',
    loginMessage: 'Sign in with your PwC credentials',
    helpUrl: 'https://pwc.com/support',
    privacyUrl: 'https://pwc.com/privacy',
    termsUrl: 'https://pwc.com/terms',
  },
  features: {
    courseContent: true,
    quizzes: true,
    qubits: true,
    certificates: true,
    aiAssistant: true,
    studyGroups: true,
    forum: true,
    liveSessions: true,
    analytics: true,
    gamification: true,
    flashcards: true,
    mindMaps: true,
    focusMode: true,
    calendar: true,
    examSimulator: true,
    weakAreaDrills: true,
    progressSharing: true,
    leaderboards: true,
    customReporting: true,
    apiAccess: true,
  },
  adminEmail: 'learning@pwc.com',
  supportEmail: 'support@pwc.com',
  subscriptionTier: 'enterprise',
  subscriptionStatus: 'active',
  trialEndsAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
};

const DEFAULT_FEATURES = getFeaturesForTier('enterprise');
const DEFAULT_BRANDING = getDefaultBranding();

// ============================================================================
// CONTEXT
// ============================================================================

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface CompanyProviderProps {
  children: ReactNode;
  initialCompany?: Company | null;
  companySlug?: string;
}

export function CompanyProvider({
  children,
  initialCompany = PWC_COMPANY,
  companySlug,
}: CompanyProviderProps) {
  const [company, setCompany] = useState<Company | null>(initialCompany);
  const [branding, setBranding] = useState<CompanyBranding>(
    initialCompany?.branding || DEFAULT_BRANDING
  );
  const [features, setFeatures] = useState<CompanyFeatures>(
    initialCompany?.features || DEFAULT_FEATURES
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load company by slug
  useEffect(() => {
    if (companySlug && companySlug !== company?.slug) {
      loadCompany(companySlug);
    }
  }, [companySlug]);

  // Apply CSS variables when branding changes
  useEffect(() => {
    applyBrandingCSS(branding);
  }, [branding]);

  // Listen for real-time config updates from sales portal
  useEffect(() => {
    const LEARNER_CONFIG_KEY = 'koenig_learner_config';

    // Check for existing config on mount
    const loadExistingConfig = () => {
      try {
        const stored = localStorage.getItem(LEARNER_CONFIG_KEY);
        if (stored) {
          const config = JSON.parse(stored);
          // Only apply if this config is for our company or if we're not company-specific
          if (!company?.slug || config.slug === company.slug) {
            if (config.branding) {
              setBranding(prev => ({ ...prev, ...config.branding }));
            }
            if (config.features) {
              setFeatures(prev => ({ ...prev, ...config.features }));
            }
          }
        }
      } catch (error) {
        console.error('Failed to load config from sales portal:', error);
      }
    };

    // Listen for storage events from sales portal (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LEARNER_CONFIG_KEY && e.newValue) {
        try {
          const config = JSON.parse(e.newValue);
          if (!company?.slug || config.slug === company.slug) {
            if (config.branding) {
              setBranding(prev => ({ ...prev, ...config.branding }));
            }
            if (config.features) {
              setFeatures(prev => ({ ...prev, ...config.features }));
            }
          }
        } catch (error) {
          console.error('Failed to parse config update:', error);
        }
      }
    };

    // Listen for custom events (same-tab)
    const handleConfigUpdate = (e: CustomEvent) => {
      const config = e.detail;
      if (!company?.slug || config.slug === company.slug) {
        if (config.branding) {
          setBranding(prev => ({ ...prev, ...config.branding }));
        }
        if (config.features) {
          setFeatures(prev => ({ ...prev, ...config.features }));
        }
      }
    };

    loadExistingConfig();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('learner-config-update', handleConfigUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('learner-config-update', handleConfigUpdate as EventListener);
    };
  }, [company?.slug]);

  // Load company data from API or preset
  const loadCompany = async (slug: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // First check if we have a preset for this company
      const preset = getPresetById(slug);
      if (preset) {
        const companyData: Company = {
          id: `${slug}-001`,
          name: preset.name,
          slug: slug,
          industry: preset.industry,
          size: preset.recommendedFor[0] || 'enterprise',
          logo: `/logos/${slug}-logo.png`,
          favicon: `/favicons/${slug}.ico`,
          branding: preset.branding,
          features: preset.features,
          adminEmail: `admin@${slug}.com`,
          supportEmail: `support@${slug}.com`,
          subscriptionTier: 'enterprise',
          subscriptionStatus: 'active',
          trialEndsAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
        };
        setCompany(companyData);
        setBranding(preset.branding);
        setFeatures(preset.features);
        return;
      }

      // Otherwise try to load from API
      const response = await fetch(`/api/companies/${slug}`);
      if (!response.ok) {
        throw new Error('Company not found');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setCompany(data.data);
        setBranding(data.data.branding);
        setFeatures(data.data.features);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load company');
      // Fall back to defaults
      setCompany(PWC_COMPANY);
      setBranding(PWC_COMPANY.branding);
      setFeatures(PWC_COMPANY.features);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply branding as CSS custom properties
  const applyBrandingCSS = (b: CompanyBranding) => {
    const root = document.documentElement;

    // Colors
    root.style.setProperty('--color-primary', b.primaryColor);
    root.style.setProperty('--color-secondary', b.secondaryColor);
    root.style.setProperty('--color-accent', b.accentColor);
    root.style.setProperty('--color-background', b.backgroundColor);
    root.style.setProperty('--color-header', b.headerBackground);
    root.style.setProperty('--color-text', b.textColor);

    // Contrast colors for buttons/text on colored backgrounds
    root.style.setProperty('--color-primary-contrast', getContrastColor(b.primaryColor));
    root.style.setProperty('--color-secondary-contrast', getContrastColor(b.secondaryColor));
    root.style.setProperty('--color-accent-contrast', getContrastColor(b.accentColor));

    // Typography
    root.style.setProperty('--font-family', b.fontFamily);
    root.style.setProperty('--font-heading', b.headingFont);

    // Border radius based on button style
    const borderRadius = b.buttonStyle === 'pill' ? '9999px' : b.buttonStyle === 'square' ? '4px' : '8px';
    root.style.setProperty('--border-radius-button', borderRadius);

    // Card style
    const cardShadow = b.cardStyle === 'elevated' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none';
    const cardBorder = b.cardStyle === 'bordered' ? '1px solid #e5e7eb' : 'none';
    root.style.setProperty('--card-shadow', cardShadow);
    root.style.setProperty('--card-border', cardBorder);
  };

  // Check if a feature is enabled
  const hasFeature = useCallback(
    (feature: keyof CompanyFeatures): boolean => {
      return features[feature] ?? false;
    },
    [features]
  );

  const isFeatureEnabled = useCallback(
    (feature: string): boolean => {
      return features[feature as keyof CompanyFeatures] ?? false;
    },
    [features]
  );

  // Update branding
  const updateBranding = useCallback((updates: Partial<CompanyBranding>) => {
    setBranding(prev => ({ ...prev, ...updates }));
  }, []);

  // Update features
  const updateFeatures = useCallback((updates: Partial<CompanyFeatures>) => {
    setFeatures(prev => ({ ...prev, ...updates }));
  }, []);

  // Load a preset
  const loadPreset = useCallback((presetId: string) => {
    const preset = getPresetById(presetId);
    if (preset) {
      setBranding(preset.branding);
      setFeatures(preset.features);
    }
  }, []);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setBranding(DEFAULT_BRANDING);
    setFeatures(DEFAULT_FEATURES);
  }, []);

  // Get CSS variables as object
  const getCSSVariables = useCallback((): Record<string, string> => {
    return {
      '--color-primary': branding.primaryColor,
      '--color-secondary': branding.secondaryColor,
      '--color-accent': branding.accentColor,
      '--color-background': branding.backgroundColor,
      '--color-header': branding.headerBackground,
      '--color-text': branding.textColor,
      '--color-primary-contrast': getContrastColor(branding.primaryColor),
      '--font-family': branding.fontFamily,
      '--font-heading': branding.headingFont,
    };
  }, [branding]);

  const value: CompanyContextValue = {
    company,
    isLoading,
    error,
    branding,
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    accentColor: branding.accentColor,
    logoUrl: company?.logo || null,
    features,
    hasFeature,
    isFeatureEnabled,
    industry: company?.industry || null,
    companySize: company?.size || null,
    subscriptionTier: company?.subscriptionTier || 'enterprise',
    updateBranding,
    updateFeatures,
    loadPreset,
    resetToDefaults,
    getCSSVariables,
    welcomeTitle: branding.welcomeTitle,
    welcomeSubtitle: branding.welcomeSubtitle,
    loginMessage: branding.loginMessage,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}

/**
 * Hook to check if a feature is enabled
 */
export function useFeature(feature: keyof CompanyFeatures): boolean {
  const { hasFeature } = useCompany();
  return hasFeature(feature);
}

/**
 * Hook to get branding values
 */
export function useBranding() {
  const { branding, primaryColor, secondaryColor, accentColor, logoUrl } = useCompany();
  return { branding, primaryColor, secondaryColor, accentColor, logoUrl };
}

// ============================================================================
// FEATURE GATE COMPONENT
// ============================================================================

interface FeatureGateProps {
  feature: keyof CompanyFeatures;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component to conditionally render based on feature availability
 */
export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const enabled = useFeature(feature);
  return enabled ? <>{children}</> : <>{fallback}</>;
}

// ============================================================================
// BRANDED COMPONENTS
// ============================================================================

interface BrandedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Button that automatically uses company branding
 */
export function BrandedButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: BrandedButtonProps) {
  const { primaryColor, secondaryColor, accentColor, branding } = useCompany();

  const colors = {
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    outline: 'transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const borderRadius = {
    rounded: 'rounded-lg',
    pill: 'rounded-full',
    square: 'rounded',
  };

  const baseColor = colors[variant];
  const contrastColor = getContrastColor(baseColor);

  return (
    <button
      className={`font-medium transition-all ${sizes[size]} ${borderRadius[branding.buttonStyle]} ${className}`}
      style={{
        backgroundColor: variant === 'outline' ? 'transparent' : baseColor,
        color: variant === 'outline' ? baseColor : contrastColor,
        border: variant === 'outline' ? `2px solid ${baseColor}` : 'none',
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export default CompanyContext;
