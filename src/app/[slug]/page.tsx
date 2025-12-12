'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Header from '@/components/Header';
import CourseHeader from '@/components/CourseHeader';
import TabNavigation from '@/components/TabNavigation';
import ModuleList from '@/components/ModuleList';
import VideoPlayer from '@/components/VideoPlayer';
import YouTubePlayer from '@/components/YouTubePlayer';
import QuizModal from '@/components/QuizModal';
import QubitsPracticeModal from '@/components/QubitsPracticeModal';
import ProgressSidebar from '@/components/ProgressSidebar';
import QubitsSection from '@/components/QubitsSection';
import ResourcesSection from '@/components/ResourcesSection';
import SupportSection from '@/components/SupportSection';
import CertificateSection from '@/components/CertificateSection';

// New Feature Components
import AIStudyAssistant from '@/components/AIStudyAssistant';
import BookmarksNotesPanel from '@/components/BookmarksNotesPanel';
import FocusMode from '@/components/FocusMode';
import GamificationWidget from '@/components/GamificationWidget';
import SocialHub from '@/components/SocialHub';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import StudyCalendar from '@/components/StudyCalendar';
import SpacedRepetition from '@/components/SpacedRepetition';
import MindMap from '@/components/MindMap';
import ExamPrep from '@/components/ExamPrep';
import CelebrationOverlay from '@/components/CelebrationOverlay';
import KeyboardShortcuts, { useKeyboardShortcuts } from '@/components/KeyboardShortcuts';
import WIPPopup, { useWIP } from '@/components/WIPPopup';
import { useTour, TourLauncherButton, STORAGE_KEYS } from '@/components/OnboardingTour';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useGamification } from '@/context/GamificationContext';
import {
  learnerProfile as defaultLearnerProfile,
  course,
  modules as demoModules,
  initialModulesData,
  learnerProgress as demoProgress,
  initialLearnerProgress,
  qubitsModules as demoQubitsModules,
  initialQubitsModulesData,
  qubitsDashboard as demoQubitsDashboard,
  initialQubitsDashboardData,
  trainer,
  resources,
  notifications as initialNotifications,
} from '@/data/mockData';
import { getQuestionsFromModules } from '@/data/qubitsQuestions';
import type { TabId, Lesson, Module, Quiz, QuizQuestion, QubitsModule, QubitsDashboard, Notification, LearnerProfile } from '@/types';
import {
  Loader2,
  Bot,
  Bookmark,
  Timer,
  Users,
  BarChart3,
  Calendar,
  Brain,
  Network,
  Award,
  Keyboard,
  Share2,
  Flame,
  Star,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-600 mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

// Wrapper component to handle Suspense for useSearchParams
export default function CompanyDashboardPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CompanyDashboard />
    </Suspense>
  );
}

// Helper function to determine if we should show clean slate (student portal) or demo data
function shouldShowCleanSlate(): boolean {
  if (typeof window === 'undefined') return true;
  // On company-specific URLs (/hpe, /rt, etc.), always start with clean slate
  // unless user clicked "Show Progress"
  const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);
  const parsed = stored ? JSON.parse(stored) : null;
  return !parsed?.loaded;
}

function CompanyDashboard() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { theme, isCustomBranded, setCompany } = useTheme();
  const { addXP, level, streak, xp, unlockAchievement } = useGamification();
  const { wipState, showWIP, hideWIP } = useWIP();
  const { startTour, hasCompletedTour, isFirstVisit, isInitialized } = useTour();

  // Get company slug from URL params
  const companySlug = params?.slug as string;

  // Set company theme based on URL slug
  useEffect(() => {
    if (companySlug) {
      setCompany(companySlug);
    }
  }, [companySlug, setCompany]);

  // Determine if this is a student portal (clean slate) or demo portal (populated)
  const [isCleanSlate, setIsCleanSlate] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsCleanSlate(shouldShowCleanSlate());
    }
  }, []);

  const [activeTab, setActiveTab] = useState<TabId>('course');
  // Use initial (0%) data for company-specific URLs (clean slate)
  const [modules, setModules] = useState(() => {
    if (typeof window === 'undefined') return initialModulesData;
    return shouldShowCleanSlate() ? initialModulesData : demoModules;
  });
  const [progress, setProgress] = useState(() => {
    if (typeof window === 'undefined') return initialLearnerProgress;
    return shouldShowCleanSlate() ? initialLearnerProgress : demoProgress;
  });
  const [qubitsModules, setQubitsModules] = useState<QubitsModule[]>(() => {
    if (typeof window === 'undefined') return initialQubitsModulesData;
    return shouldShowCleanSlate() ? initialQubitsModulesData : demoQubitsModules;
  });
  const [qubitsDashboard, setQubitsDashboard] = useState<QubitsDashboard>(() => {
    if (typeof window === 'undefined') return initialQubitsDashboardData;
    return shouldShowCleanSlate() ? initialQubitsDashboardData : demoQubitsDashboard;
  });
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  // Video player state
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [useYouTube, setUseYouTube] = useState(true);

  // Quiz state
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizModuleTitle, setQuizModuleTitle] = useState('');
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  // Qubits Practice Test state
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState<QuizQuestion[]>([]);
  const [practiceModuleTitle, setPracticeModuleTitle] = useState('');

  // Feature Panel States
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isSocialHubOpen, setIsSocialHubOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSpacedRepOpen, setIsSpacedRepOpen] = useState(false);
  const [isMindMapOpen, setIsMindMapOpen] = useState(false);
  const [isExamPrepOpen, setIsExamPrepOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    '?': () => setIsShortcutsOpen(true),
    'ctrl+a': () => setIsAIAssistantOpen(true),
    'ctrl+b': () => setIsBookmarksOpen(true),
    'ctrl+f': () => setIsFocusModeOpen(true),
    'ctrl+s': () => setIsSocialHubOpen(true),
    'escape': () => {
      setIsAIAssistantOpen(false);
      setIsBookmarksOpen(false);
      setIsFocusModeOpen(false);
      setIsSocialHubOpen(false);
      setIsAnalyticsOpen(false);
      setIsCalendarOpen(false);
      setIsSpacedRepOpen(false);
      setIsMindMapOpen(false);
      setIsExamPrepOpen(false);
      setIsShortcutsOpen(false);
    },
  });

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'lesson' | 'module' | 'quiz' | 'course'>('lesson');
  const [celebrationXP, setCelebrationXP] = useState(0);

  // Create learner profile with company-specific email
  const learnerProfile: LearnerProfile = {
    ...defaultLearnerProfile,
    organization: theme.name,
    email: `learner@${companySlug || 'company'}.com`,
  };

  // Handlers
  const handleMarkNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const triggerCelebration = useCallback((type: 'lesson' | 'module' | 'quiz' | 'course', earnedXP: number) => {
    setCelebrationType(type);
    setCelebrationXP(earnedXP);
    setShowCelebration(true);
  }, []);

  const handleLessonClick = useCallback((lesson: Lesson, module: Module) => {
    if (lesson.status === 'locked') {
      showWIP('This lesson is locked. Complete the previous lessons first.');
      return;
    }
    setCurrentLesson(lesson);
    setCurrentModule(module);
    setIsVideoOpen(true);
  }, [showWIP]);

  const handleLessonComplete = useCallback(
    (lessonId: string) => {
      const xpEarned = 25;
      addXP(xpEarned);

      setModules((prevModules) =>
        prevModules.map((module) => {
          const lessonIndex = module.lessons.findIndex((l) => l.id === lessonId);
          if (lessonIndex === -1) return module;

          const updatedLessons = module.lessons.map((lesson, idx) => {
            if (lesson.id === lessonId) {
              return { ...lesson, status: 'completed' as const, progress: 100, completedAt: new Date().toISOString().split('T')[0] };
            }
            if (idx === lessonIndex + 1 && lesson.status === 'locked') {
              return { ...lesson, status: 'not_started' as const };
            }
            return lesson;
          });

          const completedLessons = updatedLessons.filter((l) => l.status === 'completed').length;
          const moduleProgress = Math.round((completedLessons / updatedLessons.length) * 100);
          const allLessonsCompleted = completedLessons === updatedLessons.length;

          let newQuiz = module.quiz;
          if (allLessonsCompleted && module.quiz.status === 'locked') {
            newQuiz = { ...module.quiz, status: 'not_started' as const };
          }

          return {
            ...module,
            lessons: updatedLessons,
            progress: moduleProgress,
            status: allLessonsCompleted ? ('completed' as const) : moduleProgress > 0 ? ('in_progress' as const) : module.status,
            quiz: newQuiz,
          };
        })
      );

      setProgress((prev) => {
        const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
        const completedLessons = modules.reduce(
          (acc, m) => acc + m.lessons.filter((l) => l.status === 'completed').length,
          0
        ) + 1;
        return {
          ...prev,
          overallProgress: Math.round((completedLessons / totalLessons) * 100),
          lessonsCompleted: completedLessons,
          lastActivity: new Date().toISOString(),
        };
      });

      triggerCelebration('lesson', xpEarned);
    },
    [modules, addXP, triggerCelebration]
  );

  const handleVideoProgress = useCallback((lessonId: string, progressPercent: number, position: number) => {
    setModules((prevModules) =>
      prevModules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) =>
          lesson.id === lessonId
            ? { ...lesson, progress: Math.max(lesson.progress, progressPercent), lastPosition: position, status: lesson.status === 'not_started' ? 'in_progress' as const : lesson.status }
            : lesson
        ),
      }))
    );
  }, []);

  const handleQuizClick = useCallback((quiz: Quiz, moduleTitle: string) => {
    if (quiz.status === 'locked') {
      showWIP('Complete all lessons in this module to unlock the quiz.');
      return;
    }
    setCurrentQuiz(quiz);
    setQuizModuleTitle(moduleTitle);
    setIsQuizOpen(true);
  }, [showWIP]);

  const handleQuizComplete = useCallback(
    (quizId: string, score: number, passed: boolean) => {
      const xpEarned = passed ? 100 : 25;
      addXP(xpEarned);

      if (passed) {
        unlockAchievement('quiz_master');
      }

      setModules((prevModules) => {
        const moduleIndex = prevModules.findIndex((m) => m.quiz.id === quizId);
        if (moduleIndex === -1) return prevModules;

        const newModules = [...prevModules];
        const module = newModules[moduleIndex];

        const newAttempt = {
          id: `attempt-${Date.now()}`,
          attemptNumber: module.quiz.attempts.length + 1,
          score,
          totalQuestions: module.quiz.totalQuestions,
          correctAnswers: Math.round((score / 100) * module.quiz.totalQuestions),
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          timeSpent: '10:00',
          passed,
        };

        newModules[moduleIndex] = {
          ...module,
          quiz: {
            ...module.quiz,
            status: passed ? 'passed' : 'failed',
            bestScore: Math.max(module.quiz.bestScore || 0, score),
            attempts: [...module.quiz.attempts, newAttempt],
          },
          status: passed ? 'completed' : module.status,
        };

        if (passed && moduleIndex < newModules.length - 1) {
          const nextModule = newModules[moduleIndex + 1];
          if (nextModule.status === 'locked') {
            newModules[moduleIndex + 1] = {
              ...nextModule,
              status: 'not_started',
              lessons: nextModule.lessons.map((l, idx) =>
                idx === 0 ? { ...l, status: 'not_started' as const } : l
              ),
            };
          }
        }

        return newModules;
      });

      setProgress((prev) => ({
        ...prev,
        quizzesPassed: passed ? prev.quizzesPassed + 1 : prev.quizzesPassed,
        lastActivity: new Date().toISOString(),
      }));

      if (passed) {
        triggerCelebration('quiz', xpEarned);
      }

      setIsQuizOpen(false);
    },
    [addXP, unlockAchievement, triggerCelebration]
  );

  const handleStartPractice = useCallback((moduleId: string) => {
    const questions = getQuestionsFromModules([moduleId]);
    if (questions.length === 0) {
      showWIP('No practice questions available for this module yet.');
      return;
    }

    const module = qubitsModules.find((m) => m.id === moduleId);
    setPracticeQuestions(questions);
    setPracticeModuleTitle(module?.title || 'Practice Test');
    setIsPracticeOpen(true);
  }, [qubitsModules, showWIP]);

  const handlePracticeComplete = useCallback(
    (score: number, totalQuestions: number) => {
      const passed = score >= 70;
      const xpEarned = passed ? 50 : 15;
      addXP(xpEarned);

      setQubitsModules((prev) =>
        prev.map((module) => {
          if (module.title === practiceModuleTitle) {
            const newAttempts = module.attempts + 1;
            const newBestScore = Math.max(module.bestScore, score);
            return {
              ...module,
              attempts: newAttempts,
              bestScore: newBestScore,
              lastAttempt: new Date().toISOString(),
              status: passed ? 'mastered' : score >= 50 ? 'reviewing' : 'learning',
            };
          }
          return module;
        })
      );

      setQubitsDashboard((prev) => ({
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
        questionsAnswered: prev.questionsAnswered + totalQuestions,
        correctAnswers: prev.correctAnswers + Math.round((score / 100) * totalQuestions),
        currentStreak: passed ? prev.currentStreak + 1 : 0,
        longestStreak: passed ? Math.max(prev.longestStreak, prev.currentStreak + 1) : prev.longestStreak,
      }));

      setIsPracticeOpen(false);
    },
    [practiceModuleTitle, addXP]
  );

  const handleQubitsReset = useCallback(() => {
    setQubitsModules(initialQubitsModulesData);
    setQubitsDashboard(initialQubitsDashboardData);
  }, []);

  const handleLoadMockProgress = useCallback(() => {
    setModules(demoModules);
    setProgress(demoProgress);
    setQubitsModules(demoQubitsModules);
    setQubitsDashboard(demoQubitsDashboard);
    setIsCleanSlate(false);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify({
        loaded: true,
        timestamp: new Date().toISOString()
      }));
    }

    showWIP('Mock progress data loaded! You can now explore the dashboard with sample data.');
  }, [showWIP]);

  const handleShareProgress = () => {
    const text = `I'm making great progress on my AZ-104 Azure Administrator certification! 🎯 Currently at ${progress.overallProgress}% completion with a ${streak}-day learning streak! #Azure #CloudComputing #Learning`;
    if (navigator.share) {
      navigator.share({ title: 'My Learning Progress', text });
    } else {
      navigator.clipboard.writeText(text);
      showWIP('Progress copied to clipboard! Share it on LinkedIn or social media.');
    }
  };

  const handleNextLesson = useCallback(() => {
    if (!currentModule || !currentLesson) return;

    const currentLessonIndex = currentModule.lessons.findIndex((l) => l.id === currentLesson.id);
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      const nextLesson = currentModule.lessons[currentLessonIndex + 1];
      if (nextLesson.status !== 'locked') {
        setCurrentLesson(nextLesson);
      }
    }
  }, [currentModule, currentLesson]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${companySlug}/login`);
    }
  }, [isLoading, isAuthenticated, router, companySlug]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Celebration Overlay */}
      <CelebrationOverlay
        isVisible={showCelebration}
        type={celebrationType}
        xpEarned={celebrationXP}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Company Branded Header Bar */}
      {isCustomBranded && (
        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
          }}
        />
      )}

      {/* White Label Banner */}
      {isCustomBranded && (
        <div
          className="py-2 px-4 text-center text-sm"
          style={{
            backgroundColor: theme.headerBg,
            color: theme.headerBg === '#1a1a1a' ? '#ffffff' : theme.primaryColor,
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <span className="font-semibold">{theme.name}</span>
            <span className="ml-4 opacity-75">|</span>
            <span className="opacity-75 ml-4">{theme.welcomeMessage}</span>
          </div>
        </div>
      )}

      <Header
        learner={learnerProfile}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onLoadMockProgress={handleLoadMockProgress}
      />

      {/* Quick Stats Bar */}
      <div className="bg-white border-b border-gray-200" data-tour="quick-stats">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <GamificationWidget compact />

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShareProgress}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                title="Share Progress"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>

              <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-medium">{streak} day streak</span>
              </div>

              <button
                onClick={() => setIsShortcutsOpen(true)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Keyboard Shortcuts (?)"
              >
                <Keyboard className="w-4 h-4" />
              </button>

              {/* Tour Launcher */}
              <TourLauncherButton />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Course Header */}
            <CourseHeader course={course} progress={progress} />

            {/* Tab Navigation */}
            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              moduleCount={modules.length}
            />

            {/* Tab Content */}
            <div className="mt-6" data-tour="course-content">
              {activeTab === 'course' && (
                <ModuleList
                  modules={modules}
                  onLessonClick={handleLessonClick}
                  onQuizClick={handleQuizClick}
                />
              )}

              {activeTab === 'qubits' && (
                <QubitsSection
                  modules={qubitsModules}
                  dashboard={qubitsDashboard}
                  onStartPractice={handleStartPractice}
                  onReset={handleQubitsReset}
                />
              )}

              {activeTab === 'resources' && (
                <ResourcesSection resources={resources} />
              )}

              {activeTab === 'support' && (
                <SupportSection trainer={trainer} course={course} />
              )}

              {activeTab === 'certificate' && (
                <CertificateSection
                  course={course}
                  progress={progress}
                  learner={learnerProfile}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0" data-tour="progress-sidebar">
            <ProgressSidebar
              progress={progress}
              modules={modules}
              course={course}
              onContinue={() => {
                const inProgressModule = modules.find((m) => m.status === 'in_progress');
                if (inProgressModule) {
                  const inProgressLesson = inProgressModule.lessons.find(
                    (l) => l.status === 'in_progress' || l.status === 'not_started'
                  );
                  if (inProgressLesson) {
                    handleLessonClick(inProgressLesson, inProgressModule);
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Feature Buttons Row */}
        <div className="mt-8 flex flex-wrap gap-2 justify-center" data-tour="feature-tools">
          {[
            { icon: Bot, label: 'AI Assistant', onClick: () => setIsAIAssistantOpen(true), color: 'cyan' },
            { icon: Bookmark, label: 'Bookmarks', onClick: () => setIsBookmarksOpen(true), color: 'amber' },
            { icon: Timer, label: 'Focus Mode', onClick: () => setIsFocusModeOpen(true), color: 'violet' },
            { icon: Users, label: 'Study Groups', onClick: () => setIsSocialHubOpen(true), color: 'green' },
            { icon: BarChart3, label: 'Analytics', onClick: () => setIsAnalyticsOpen(true), color: 'blue' },
            { icon: Calendar, label: 'Calendar', onClick: () => setIsCalendarOpen(true), color: 'rose' },
            { icon: Brain, label: 'Flashcards', onClick: () => setIsSpacedRepOpen(true), color: 'purple' },
            { icon: Network, label: 'Mind Map', onClick: () => setIsMindMapOpen(true), color: 'teal' },
            { icon: Award, label: 'Exam Prep', onClick: () => setIsExamPrepOpen(true), color: 'orange' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  'bg-white border border-gray-200 hover:border-gray-300',
                  'hover:shadow-md hover:-translate-y-0.5',
                  `hover:text-${item.color}-600`
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </main>

      {/* Video Player Modal */}
      {useYouTube ? (
        <YouTubePlayer
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
          lesson={currentLesson!}
          module={currentModule!}
          courseName={course.name}
          onComplete={handleLessonComplete}
          onProgressUpdate={handleVideoProgress}
          onNextLesson={handleNextLesson}
        />
      ) : (
        <VideoPlayer
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
          lesson={currentLesson!}
          module={currentModule!}
          courseName={course.name}
          onComplete={handleLessonComplete}
          onProgressUpdate={handleVideoProgress}
          onNextLesson={handleNextLesson}
        />
      )}

      {/* Quiz Modal */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        quiz={currentQuiz!}
        moduleTitle={quizModuleTitle}
        onComplete={handleQuizComplete}
      />

      {/* Qubits Practice Modal */}
      <QubitsPracticeModal
        isOpen={isPracticeOpen}
        onClose={() => setIsPracticeOpen(false)}
        questions={practiceQuestions}
        moduleTitle={practiceModuleTitle}
        onComplete={handlePracticeComplete}
      />

      {/* Feature Panels */}
      <AIStudyAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        currentModule={modules.find((m) => m.status === 'in_progress')}
        courseName={course.name}
      />

      <BookmarksNotesPanel
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        modules={modules}
      />

      <FocusMode
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
        onComplete={(minutes) => {
          addXP(minutes * 2);
          showWIP(`Great focus session! You earned ${minutes * 2} XP for ${minutes} minutes of focused study.`);
        }}
      />

      <SocialHub
        isOpen={isSocialHubOpen}
        onClose={() => setIsSocialHubOpen(false)}
        learner={learnerProfile}
        courseName={course.name}
      />

      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        progress={progress}
        modules={modules}
        qubitsData={qubitsDashboard}
      />

      <StudyCalendar
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        modules={modules}
        progress={progress}
      />

      <SpacedRepetition
        isOpen={isSpacedRepOpen}
        onClose={() => setIsSpacedRepOpen(false)}
        modules={modules}
        onComplete={(correct, total) => {
          const xpEarned = correct * 5;
          addXP(xpEarned);
          showWIP(`Flashcard session complete! ${correct}/${total} correct. Earned ${xpEarned} XP.`);
        }}
      />

      <MindMap
        isOpen={isMindMapOpen}
        onClose={() => setIsMindMapOpen(false)}
        modules={modules}
        courseName={course.name}
      />

      <ExamPrep
        isOpen={isExamPrepOpen}
        onClose={() => setIsExamPrepOpen(false)}
        course={course}
        progress={progress}
        modules={modules}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* WIP Popup */}
      <WIPPopup
        isOpen={wipState.isOpen}
        onClose={hideWIP}
        featureName={wipState.featureName}
      />
    </div>
  );
}
