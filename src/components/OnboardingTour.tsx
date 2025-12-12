'use client';

/**
 * Onboarding Tour Component with Koenig Mascot
 * =============================================
 *
 * Interactive guided tour for new users featuring "Koey" the Koenig mascot.
 * Highlights key features and explains how to use the portal.
 *
 * FEATURES:
 * - Koenig mascot "Koey" guides users through the dashboard
 * - Step-by-step walkthrough of all sections
 * - Spotlight highlighting on UI elements
 * - Skip, next, previous navigation
 * - Progress indicator
 * - Keyboard navigation (arrow keys, Esc)
 * - Auto-scroll to elements
 * - Persists completion state in localStorage
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// KOENIG MASCOT COMPONENT - "Koey"
// ============================================================================

interface MascotProps {
  mood: 'wave' | 'point' | 'celebrate' | 'think' | 'happy';
  size?: 'small' | 'medium' | 'large';
}

function KoenigMascot({ mood, size = 'medium' }: MascotProps) {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20',
    large: 'w-28 h-28',
  };

  // SVG mascot - A friendly owl with Koenig branding (cyan/blue colors)
  return (
    <div className={`${sizeClasses[size]} relative`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        {/* Body */}
        <ellipse cx="50" cy="60" rx="35" ry="30" fill="url(#bodyGradient)" />

        {/* Head */}
        <circle cx="50" cy="35" r="28" fill="url(#headGradient)" />

        {/* Ears/Tufts */}
        <path d="M25 20 L30 35 L20 30 Z" fill="#06b6d4" />
        <path d="M75 20 L70 35 L80 30 Z" fill="#06b6d4" />

        {/* Eyes */}
        <ellipse cx="38" cy="35" rx="10" ry="11" fill="white" />
        <ellipse cx="62" cy="35" rx="10" ry="11" fill="white" />

        {/* Pupils - animated based on mood */}
        <circle cx={mood === 'point' ? '40' : '38'} cy="36" r="5" fill="#1e3a5f" />
        <circle cx={mood === 'point' ? '64' : '62'} cy="36" r="5" fill="#1e3a5f" />

        {/* Eye shine */}
        <circle cx="40" cy="34" r="2" fill="white" opacity="0.8" />
        <circle cx="64" cy="34" r="2" fill="white" opacity="0.8" />

        {/* Beak */}
        <path d="M45 45 L50 55 L55 45 Z" fill="#f59e0b" />

        {/* Belly patch */}
        <ellipse cx="50" cy="65" rx="20" ry="18" fill="#e0f2fe" />

        {/* Wings */}
        {mood === 'wave' ? (
          <>
            <path d="M15 55 Q5 45 15 35 Q20 45 20 55 Z" fill="#0891b2" className="animate-bounce" style={{ transformOrigin: '15px 55px', animation: 'wave 0.5s ease-in-out infinite' }} />
            <path d="M85 50 Q95 50 85 65 Q80 55 80 50 Z" fill="#0891b2" />
          </>
        ) : mood === 'celebrate' ? (
          <>
            <path d="M12 40 Q2 35 15 25 Q20 40 20 50 Z" fill="#0891b2" className="animate-bounce" />
            <path d="M88 40 Q98 35 85 25 Q80 40 80 50 Z" fill="#0891b2" className="animate-bounce" />
          </>
        ) : (
          <>
            <path d="M15 55 Q5 55 15 70 Q20 60 20 55 Z" fill="#0891b2" />
            <path d="M85 55 Q95 55 85 70 Q80 60 80 55 Z" fill="#0891b2" />
          </>
        )}

        {/* Feet */}
        <ellipse cx="40" cy="88" rx="8" ry="4" fill="#f59e0b" />
        <ellipse cx="60" cy="88" rx="8" ry="4" fill="#f59e0b" />

        {/* Graduation cap for learning theme */}
        <path d="M25 18 L50 8 L75 18 L50 28 Z" fill="#1e3a5f" />
        <rect x="48" y="8" width="4" height="15" fill="#1e3a5f" />
        <circle cx="50" cy="8" r="3" fill="#f59e0b" />
        <path d="M50 8 Q60 5 65 10" stroke="#f59e0b" strokeWidth="2" fill="none" />
        <circle cx="65" cy="10" r="2" fill="#f59e0b" />

        {/* Gradients */}
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
          <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Sparkles for celebrate mood */}
      {mood === 'celebrate' && (
        <>
          <span className="absolute -top-2 -left-2 text-yellow-400 animate-ping">✨</span>
          <span className="absolute -top-2 -right-2 text-yellow-400 animate-ping" style={{ animationDelay: '0.2s' }}>✨</span>
          <span className="absolute top-0 left-1/2 text-yellow-400 animate-ping" style={{ animationDelay: '0.4s' }}>⭐</span>
        </>
      )}
    </div>
  );
}

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
  mascotMood?: 'wave' | 'point' | 'celebrate' | 'think' | 'happy';
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
    title: 'Welcome to Koenig Learning Portal! 🎓',
    content: "Hi there! I'm Koey, your learning companion! I'll show you around the portal so you can make the most of your learning journey. Let's get started!",
    position: 'center',
    mascotMood: 'wave',
    category: 'intro',
  },

  // Course Header
  {
    id: 'course-header',
    target: '[data-tour="course-header"]',
    title: 'Your Course Dashboard',
    content: "This is your course at a glance! You can see your overall progress with the circular indicator. It updates automatically as you complete lessons and quizzes.",
    position: 'bottom',
    spotlightPadding: 15,
    mascotMood: 'point',
    category: 'courses',
  },

  // Tab Navigation
  {
    id: 'tabs',
    target: '[data-tour="tabs"]',
    title: 'Navigation Made Easy',
    content: "These tabs help you navigate between different sections: Course content for lessons, Qubits for practice tests, Resources for study materials, Support for help, and Certificate when you're done!",
    position: 'bottom',
    spotlightPadding: 10,
    mascotMood: 'point',
    category: 'navigation',
  },

  // Module List
  {
    id: 'modules',
    target: '[data-tour="modules"]',
    title: 'Course Modules & Lessons',
    content: "Your course is organized into modules. Click any lesson to watch the video. Once you complete all lessons in a module, you'll unlock the quiz! 📚",
    position: 'right',
    spotlightPadding: 15,
    mascotMood: 'happy',
    category: 'courses',
  },

  // Quick Stats Bar
  {
    id: 'quick-stats',
    target: '[data-tour="quick-stats"]',
    title: 'Quick Stats & Actions',
    content: "Here you can see your XP, level, and learning streak! Plus quick access to AI Assistant, Focus Mode, and Exam Prep. These tools supercharge your learning!",
    position: 'bottom',
    spotlightPadding: 10,
    mascotMood: 'think',
    category: 'tools',
  },

  // Progress Sidebar
  {
    id: 'progress-sidebar',
    target: '[data-tour="progress-sidebar"]',
    title: 'Track Your Progress',
    content: "This sidebar shows your complete learning stats - lessons completed, quizzes passed, time spent, and overall progress. Watch these numbers grow! 📊",
    position: 'left',
    spotlightPadding: 15,
    mascotMood: 'happy',
    category: 'progress',
  },

  // Gamification Widget
  {
    id: 'gamification',
    target: '[data-tour="gamification"]',
    title: 'Earn XP & Achievements!',
    content: "Learning is more fun with rewards! Earn XP for every action, complete daily challenges, unlock achievements, and maintain your streak for bonus rewards! 🏆",
    position: 'left',
    spotlightPadding: 15,
    mascotMood: 'celebrate',
    category: 'gamification',
  },

  // Quick Tools
  {
    id: 'quick-tools',
    target: '[data-tour="quick-tools"]',
    title: 'Powerful Learning Tools',
    content: "Access Bookmarks to save important content, Calendar to plan your study schedule, Flashcards for quick revision, Mind Maps for visual learning, and Community to connect with others!",
    position: 'left',
    spotlightPadding: 10,
    mascotMood: 'point',
    category: 'tools',
  },

  // Share Progress Button
  {
    id: 'share-progress',
    target: '[data-tour="share-progress"]',
    title: 'Share Your Success!',
    content: "Proud of your progress? Share it on LinkedIn and social media! Let the world know about your learning journey. 🚀",
    position: 'left',
    spotlightPadding: 10,
    mascotMood: 'celebrate',
    category: 'social',
  },

  // Tour Button
  {
    id: 'tour-button',
    target: '[data-tour="tour-button"]',
    title: 'Need Help Anytime?',
    content: "You can restart this guided tour anytime by clicking here. I'll always be here to help you navigate! 💡",
    position: 'left',
    spotlightPadding: 10,
    mascotMood: 'wave',
    category: 'help',
  },

  // Keyboard shortcuts tip
  {
    id: 'keyboard-tip',
    target: 'body',
    title: 'Pro Tips for Power Users! ⌨️',
    content: 'Press "?" anytime to see keyboard shortcuts. Use Ctrl+A for AI Assistant, Ctrl+B for Bookmarks, Ctrl+F for Focus Mode. Press Escape to close any panel.',
    position: 'center',
    mascotMood: 'think',
    category: 'tips',
  },

  // Completion
  {
    id: 'tour-complete',
    target: 'body',
    title: "You're All Set! 🎉",
    content: "Great job! You now know your way around the portal. Start by clicking on any lesson to begin learning. I believe in you - let's ace that certification! Good luck! 🍀",
    position: 'center',
    mascotMood: 'celebrate',
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
  const [isAnimating, setIsAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  // Find and highlight target element
  const updateSpotlight = useCallback(() => {
    if (!step || step.position === 'center') {
      setSpotlightRect(null);
      // Center the tooltip
      setTooltipPosition({
        top: window.innerHeight / 2 - 180,
        left: window.innerWidth / 2 - 220,
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
    const padding = step.spotlightPadding || 8;

    setSpotlightRect(new DOMRect(
      rect.x - padding,
      rect.y - padding,
      rect.width + padding * 2,
      rect.height + padding * 2
    ));

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Calculate tooltip position
    const tooltipWidth = 440;
    const tooltipHeight = 280;
    const margin = 24;

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
      setIsAnimating(true);
      const timer = setTimeout(() => {
        updateSpotlight();
        setIsAnimating(false);
      }, 300);

      // Run step action if defined
      if (step?.action) {
        step.action();
      }

      return () => clearTimeout(timer);
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

  if (!isOpen || !step) return null;

  return (
    <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true">
      {/* Overlay with spotlight cutout */}
      <div className="absolute inset-0 transition-all duration-500">
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
                  rx="12"
                  fill="black"
                  className="transition-all duration-500"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.8)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight border with glow */}
        {spotlightRect && (
          <div
            className="absolute border-2 border-cyan-400 rounded-xl transition-all duration-500"
            style={{
              top: spotlightRect.y,
              left: spotlightRect.x,
              width: spotlightRect.width,
              height: spotlightRect.height,
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.3)',
            }}
          />
        )}
      </div>

      {/* Tooltip with Mascot */}
      <div
        ref={tooltipRef}
        className={`absolute bg-white rounded-2xl shadow-2xl w-[440px] transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-t-2xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Mascot floating on the side */}
        <div className="absolute -left-16 top-1/2 transform -translate-y-1/2">
          <KoenigMascot mood={step.mascotMood || 'happy'} size="large" />
        </div>

        {/* Content */}
        <div className="p-6 pl-8">
          {/* Category badge */}
          {step.category && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 text-xs font-semibold uppercase tracking-wide rounded-full border border-cyan-200">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                {step.category}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>

          {/* Content with speech bubble style */}
          <div className="relative bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
            <p className="text-gray-600 leading-relaxed">{step.content}</p>
            {/* Speech bubble pointer */}
            <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-gray-50"></div>
          </div>

          {/* Step indicator dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-6 bg-gradient-to-r from-cyan-500 to-blue-500'
                    : idx < currentStep
                      ? 'bg-cyan-300'
                      : 'bg-gray-200'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 font-medium">
                {currentStep + 1} of {TOUR_STEPS.length}
              </span>
              <button
                onClick={handleSkip}
                className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2"
              >
                Skip tour
              </button>
            </div>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-200"
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <>
                    Let's Go!
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
        </div>

        {/* Keyboard hint */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-400 text-center bg-gray-50 py-2 rounded-lg">
            💡 Use <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">←</kbd> <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">→</kbd> arrow keys or <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">Enter</kbd> to navigate • <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">Esc</kbd> to close
          </p>
        </div>
      </div>

      {/* Close button (always visible) */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
        aria-label="Close tour"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Bottom help text */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
          <KoenigMascot mood="happy" size="small" />
          <p className="text-white/80 text-sm">
            {demoMode ? 'Demo Mode - Showing portal features' : "Hi! I'm Koey, your learning guide!"}
          </p>
        </div>
      </div>

      {/* CSS for wave animation */}
      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// TOUR LAUNCHER BUTTON WITH MASCOT
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
        className="p-2 rounded-full bg-cyan-100 text-cyan-600 hover:bg-cyan-200 transition-all hover:scale-110 group"
        title="Start guided tour with Koey"
        data-tour="tour-button"
      >
        <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-200 hover:shadow-cyan-300 hover:scale-105"
      data-tour="tour-button"
    >
      <div className="w-6 h-6">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="40" r="25" fill="white" />
          <circle cx="42" cy="38" r="4" fill="#06b6d4" />
          <circle cx="58" cy="38" r="4" fill="#06b6d4" />
          <path d="M45 48 L50 55 L55 48 Z" fill="#f59e0b" />
        </svg>
      </div>
      <span>Tour with Koey</span>
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
  isFirstVisit: boolean;
  isInitialized: boolean;
  resetTour: () => void;
}

const TourContext = React.createContext<TourContextValue | null>(null);

// Storage key constants
const STORAGE_KEYS = {
  TOUR_COMPLETED: 'learnova_tour_completed',
  FIRST_VISIT: 'learnova_first_visit',
  PROGRESS: 'learnova_user_progress',
};

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [shouldAutoStart, setShouldAutoStart] = useState(false);

  // Initialize tour state from localStorage
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    const tourCompleted = localStorage.getItem(STORAGE_KEYS.TOUR_COMPLETED);
    const visitedBefore = localStorage.getItem(STORAGE_KEYS.FIRST_VISIT);

    console.log('[Tour] Init check - tourCompleted:', tourCompleted, 'visitedBefore:', visitedBefore);

    // First time visitor - never been here before
    if (visitedBefore === null) {
      console.log('[Tour] First time visitor detected!');
      localStorage.setItem(STORAGE_KEYS.FIRST_VISIT, new Date().toISOString());
      setIsFirstVisit(true);
      setHasCompletedTour(false);
      setShouldAutoStart(true);
    } else {
      // Returning visitor - check if tour was completed
      setIsFirstVisit(false);
      setHasCompletedTour(tourCompleted === 'true');
    }

    setIsInitialized(true);
  }, []);

  // Auto-start tour for first-time visitors after initialization
  useEffect(() => {
    if (isInitialized && shouldAutoStart && !isActive) {
      console.log('[Tour] Auto-starting tour for first-time visitor');
      // Delay to allow page to fully render
      const timer = setTimeout(() => {
        setIsActive(true);
        setShouldAutoStart(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, shouldAutoStart, isActive]);

  const startTour = useCallback((demo = false) => {
    console.log('[Tour] Starting tour manually, demo:', demo);
    setDemoMode(demo);
    setIsActive(true);
  }, []);

  const resetTour = useCallback(() => {
    console.log('[Tour] Resetting tour');
    localStorage.removeItem(STORAGE_KEYS.TOUR_COMPLETED);
    localStorage.removeItem(STORAGE_KEYS.FIRST_VISIT);
    setHasCompletedTour(false);
    setIsFirstVisit(true);
  }, []);

  const handleComplete = useCallback(() => {
    console.log('[Tour] Tour completed');
    setIsActive(false);
    setHasCompletedTour(true);
    localStorage.setItem(STORAGE_KEYS.TOUR_COMPLETED, 'true');
  }, []);

  const handleClose = useCallback(() => {
    console.log('[Tour] Tour closed');
    setIsActive(false);
    // Mark as completed even if closed early
    setHasCompletedTour(true);
    localStorage.setItem(STORAGE_KEYS.TOUR_COMPLETED, 'true');
  }, []);

  const contextValue = React.useMemo(() => ({
    startTour,
    isActive,
    hasCompletedTour,
    isFirstVisit,
    isInitialized,
    resetTour,
  }), [startTour, isActive, hasCompletedTour, isFirstVisit, isInitialized, resetTour]);

  return (
    <TourContext.Provider value={contextValue}>
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

// Export storage keys for use in other components
export { STORAGE_KEYS };
