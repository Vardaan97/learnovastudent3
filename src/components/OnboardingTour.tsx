'use client';

/**
 * Onboarding Tour Component
 * =========================
 *
 * Interactive guided tour for new users and client demos.
 * Highlights key features and explains how to use the portal.
 *
 * FEATURES:
 * - Step-by-step walkthrough of all sections
 * - Spotlight highlighting on UI elements
 * - Skip, next, previous navigation
 * - Progress indicator
 * - Keyboard navigation (arrow keys, Esc)
 * - Auto-scroll to elements
 * - Demo mode for sales presentations
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface TourStep {
  id: string;
  target: string;           // CSS selector for element to highlight
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  spotlightPadding?: number;
  action?: () => void;      // Optional action when step is shown
  waitForElement?: boolean; // Wait for element to exist
  category?: string;        // For grouping related steps
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  demoMode?: boolean;       // Slower pace for demos
  startFromStep?: number;
}

// ============================================================================
// TOUR STEPS DATA
// ============================================================================

const TOUR_STEPS: TourStep[] = [
  // Welcome
  {
    id: 'welcome',
    target: 'body',
    title: 'Welcome to Koenig Learning Portal! 🎉',
    content: 'This quick tour will show you how to navigate the portal and make the most of your learning experience. Use arrow keys or click Next to continue.',
    position: 'center',
    category: 'intro',
  },

  // Course Header
  {
    id: 'course-header',
    target: '[data-tour="course-header"]',
    title: 'Your Current Course',
    content: 'This shows your enrolled course with overall progress. The circular progress indicator updates as you complete lessons and quizzes.',
    position: 'bottom',
    spotlightPadding: 15,
    category: 'courses',
  },

  // Tab Navigation
  {
    id: 'tabs',
    target: '[data-tour="tabs"]',
    title: 'Main Navigation Tabs',
    content: 'Switch between Course content, Qubits practice tests, Resources, Support, and your Certificate. Each tab has specialized features.',
    position: 'bottom',
    spotlightPadding: 10,
    category: 'navigation',
  },

  // Module List
  {
    id: 'modules',
    target: '[data-tour="modules"]',
    title: 'Course Modules',
    content: 'Your course is divided into modules. Click on any lesson to watch the video. Complete all lessons to unlock the module quiz!',
    position: 'right',
    spotlightPadding: 15,
    category: 'courses',
  },

  // Quick Stats
  {
    id: 'quick-stats',
    target: '[data-tour="quick-stats"]',
    title: 'Quick Stats & Tools',
    content: 'See your XP, level, and streak at a glance. Quick access to AI Assistant, Focus Mode, and Exam Prep are always available here.',
    position: 'bottom',
    spotlightPadding: 10,
    category: 'tools',
  },

  // Progress Sidebar
  {
    id: 'progress-sidebar',
    target: '[data-tour="progress-sidebar"]',
    title: 'Your Progress',
    content: 'Track your overall progress, lessons completed, quizzes passed, and time spent learning. Your statistics update in real-time!',
    position: 'left',
    spotlightPadding: 15,
    category: 'progress',
  },

  // Gamification Widget
  {
    id: 'gamification',
    target: '[data-tour="gamification"]',
    title: 'Gamification & Achievements',
    content: 'Earn XP for every action! Complete daily challenges, unlock achievements, and level up. Keep your streak going for bonus XP!',
    position: 'left',
    spotlightPadding: 15,
    category: 'gamification',
  },

  // Quick Tools
  {
    id: 'quick-tools',
    target: '[data-tour="quick-tools"]',
    title: 'Quick Tools',
    content: 'Access Bookmarks, Calendar, Flashcards, Mind Maps, Community, and Analytics. These tools enhance your learning experience.',
    position: 'left',
    spotlightPadding: 10,
    category: 'tools',
  },

  // Share Progress
  {
    id: 'share-progress',
    target: '[data-tour="share-progress"]',
    title: 'Share Your Progress',
    content: 'Celebrate your achievements! Share your progress on LinkedIn and social media to showcase your learning journey.',
    position: 'left',
    spotlightPadding: 10,
    category: 'social',
  },

  // Tour Button
  {
    id: 'tour-button',
    target: '[data-tour="tour-button"]',
    title: 'Take Guided Tour Anytime',
    content: 'Need a refresher? Click this button anytime to restart the guided tour. Great for exploring new features!',
    position: 'left',
    spotlightPadding: 10,
    category: 'help',
  },

  // Keyboard shortcuts tip
  {
    id: 'keyboard-tip',
    target: 'body',
    title: 'Pro Tips! ⌨️',
    content: 'Press "?" for keyboard shortcuts. Use Ctrl+A for AI Assistant, Ctrl+B for Bookmarks, Ctrl+F for Focus Mode. Press Escape to close any panel.',
    position: 'center',
    category: 'tips',
  },

  // Completion
  {
    id: 'tour-complete',
    target: 'body',
    title: 'You\'re All Set! 🚀',
    content: 'Start learning by clicking on any lesson. Complete quizzes to unlock achievements. Good luck with your certification journey!',
    position: 'center',
    category: 'outro',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function OnboardingTour({
  isOpen,
  onClose,
  onComplete,
  demoMode = false,
  startFromStep = 0,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(startFromStep);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  // Find and highlight target element
  const updateSpotlight = useCallback(() => {
    if (!step || step.position === 'center') {
      setSpotlightRect(null);
      // Center the tooltip
      setTooltipPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 200,
      });
      return;
    }

    const element = document.querySelector(step.target);
    if (!element) {
      if (step.waitForElement) {
        // Retry after a short delay
        setTimeout(updateSpotlight, 500);
      } else {
        // Skip to next step if element doesn't exist
        handleNext();
      }
      return;
    }

    const rect = element.getBoundingClientRect();
    const padding = step.spotlightPadding || 5;

    setSpotlightRect(new DOMRect(
      rect.x - padding,
      rect.y - padding,
      rect.width + padding * 2,
      rect.height + padding * 2
    ));

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Calculate tooltip position
    const tooltipWidth = 380;
    const tooltipHeight = 200;
    const margin = 20;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'top':
        top = rect.top - tooltipHeight - margin;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + margin;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - margin;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + margin;
        break;
    }

    // Keep tooltip within viewport
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));

    setTooltipPosition({ top, left });
  }, [step]);

  useEffect(() => {
    if (isOpen) {
      updateSpotlight();
      // Run step action if defined
      if (step?.action) {
        step.action();
      }
    }
  }, [isOpen, currentStep, updateSpotlight, step]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
        case 'Enter':
          handleNext();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  // Handle window resize
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => updateSpotlight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, updateSpotlight]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleJumpToCategory = (category: string) => {
    const index = TOUR_STEPS.findIndex(s => s.category === category);
    if (index >= 0) {
      setCurrentStep(index);
    }
  };

  if (!isOpen || !step) return null;

  // Get unique categories for quick navigation
  const categories = [...new Set(TOUR_STEPS.map(s => s.category).filter(Boolean))];

  return (
    <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true">
      {/* Overlay with spotlight cutout */}
      <div className="absolute inset-0 transition-all duration-300">
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {spotlightRect && (
                <rect
                  x={spotlightRect.x}
                  y={spotlightRect.y}
                  width={spotlightRect.width}
                  height={spotlightRect.height}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight border */}
        {spotlightRect && (
          <div
            className="absolute border-2 border-cyan-400 rounded-lg transition-all duration-300 animate-pulse"
            style={{
              top: spotlightRect.y,
              left: spotlightRect.x,
              width: spotlightRect.width,
              height: spotlightRect.height,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute bg-white rounded-xl shadow-2xl w-[380px] transition-all duration-300"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 rounded-t-xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Category indicator */}
        {step.category && (
          <div className="px-4 pt-3">
            <span className="text-xs font-medium text-cyan-600 uppercase tracking-wide">
              {step.category}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{step.content}</p>
        </div>

        {/* Quick navigation (for demos) */}
        {demoMode && (
          <div className="px-4 pb-2 flex flex-wrap gap-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleJumpToCategory(cat!)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${
                  step.category === cat
                    ? 'bg-cyan-100 text-cyan-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {currentStep + 1} / {TOUR_STEPS.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Skip tour
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all flex items-center gap-1"
            >
              {currentStep === TOUR_STEPS.length - 1 ? (
                <>
                  Finish
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : (
                <>
                  Next
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="px-4 pb-3 border-t border-gray-100 pt-2">
          <p className="text-xs text-gray-400 text-center">
            Use arrow keys or Enter to navigate • Esc to close
          </p>
        </div>
      </div>

      {/* Close button (always visible) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Close tour"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Help text at bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <p className="text-white/60 text-sm">
          {demoMode ? 'Demo Mode - Click categories above to jump sections' : 'First time here? This tour shows you around!'}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// TOUR LAUNCHER BUTTON
// ============================================================================

export function TourLauncherButton({
  onClick,
  variant = 'icon',
}: {
  onClick: () => void;
  variant?: 'icon' | 'full';
}) {
  if (variant === 'icon') {
    return (
      <button
        onClick={onClick}
        className="p-2 rounded-full bg-cyan-100 text-cyan-600 hover:bg-cyan-200 transition-colors"
        title="Start guided tour"
        data-tour="tour-button"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all"
      data-tour="tour-button"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Take a Tour
    </button>
  );
}

// ============================================================================
// TOUR CONTEXT (for managing tour state globally)
// ============================================================================

interface TourContextValue {
  startTour: (demoMode?: boolean) => void;
  isActive: boolean;
  hasCompletedTour: boolean;
}

const TourContext = React.createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  useEffect(() => {
    // Check if user has completed tour before
    const completed = localStorage.getItem('onboarding_tour_completed');
    setHasCompletedTour(completed === 'true');
  }, []);

  const startTour = (demo = false) => {
    setDemoMode(demo);
    setIsActive(true);
  };

  const handleComplete = () => {
    setIsActive(false);
    setHasCompletedTour(true);
    localStorage.setItem('onboarding_tour_completed', 'true');
  };

  const handleClose = () => {
    setIsActive(false);
  };

  return (
    <TourContext.Provider value={{ startTour, isActive, hasCompletedTour }}>
      {children}
      <OnboardingTour
        isOpen={isActive}
        onClose={handleClose}
        onComplete={handleComplete}
        demoMode={demoMode}
      />
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = React.useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
