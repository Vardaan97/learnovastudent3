'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
export default function LearnerDashboardPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LearnerDashboard />
    </Suspense>
  );
}

// Helper function to determine if we should show clean slate (student portal) or demo data
function shouldShowCleanSlate(): boolean {
  if (typeof window === 'undefined') return true;
  const hostname = window.location.hostname;
  // student.learnova.training = clean slate (new user experience)
  // learnova.training or learnovastudent3.vercel.app = demo data (for showing populated dashboard)
  // localhost = check for manual override or default to clean slate
  if (hostname.startsWith('student.') || hostname.includes('localhost')) {
    // On student portal, check if user explicitly loaded demo data
    const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    const parsed = stored ? JSON.parse(stored) : null;
    return !parsed?.loaded; // Clean slate unless user clicked "Show Progress"
  }
  // On main demo portal (learnova.training), show demo data
  return false;
}

function LearnerDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { theme, isCustomBranded } = useTheme();
  const { addXP, level, streak, xp, unlockAchievement } = useGamification();
  const { wipState, showWIP, hideWIP } = useWIP();
  const { startTour, hasCompletedTour, isFirstVisit, isInitialized } = useTour();

  // Determine if this is a student portal (clean slate) or demo portal (populated)
  const [isCleanSlate, setIsCleanSlate] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsCleanSlate(shouldShowCleanSlate());
    }
  }, []);

  const [activeTab, setActiveTab] = useState<TabId>('course');
  // Use initial (0%) data for student portal, demo data for main learnova.training
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

  // Note: On student.learnova.training, we don't auto-save progress marker
  // Users can click "Show Progress" button to load demo data

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

  // Create learner profile from auth user
  const learnerProfile: LearnerProfile = user
    ? {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        learnerId: `KS-${user.id.substring(0, 8).toUpperCase()}`,
        enrolledDate: new Date().toISOString().split('T')[0],
        organization: user.organizationId || 'Individual Learner',
      }
    : defaultLearnerProfile;

  // Handle OAuth callback
  useEffect(() => {
    const authUser = searchParams.get('auth_user');
    if (authUser) {
      try {
        const userData = JSON.parse(decodeURIComponent(authUser));
        const setAuthUser = (window as unknown as { __setAuthUser?: (user: typeof userData) => void }).__setAuthUser;
        if (setAuthUser) {
          setAuthUser(userData);
        }
        router.replace('/');
      } catch (error) {
        console.error('Failed to parse auth user:', error);
      }
    }
  }, [searchParams, router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Mark notification as read
  const handleMarkNotificationRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  }, []);

  // Find lesson and module by ID
  const findLessonAndModule = useCallback(
    (lessonId: string, moduleId: string) => {
      const module = modules.find((m) => m.id === moduleId);
      const lesson = module?.lessons.find((l) => l.id === lessonId);
      return { module, lesson };
    },
    [modules]
  );

  // Handle play lesson
  const handlePlayLesson = useCallback(
    (lessonId: string, moduleId: string) => {
      const { module, lesson } = findLessonAndModule(lessonId, moduleId);
      if (lesson && module) {
        setCurrentLesson(lesson);
        setCurrentModule(module);
        setIsVideoOpen(true);
      }
    },
    [findLessonAndModule]
  );

  // Handle start quiz
  const handleStartQuiz = useCallback(
    (quizId: string, moduleId: string) => {
      const module = modules.find((m) => m.id === moduleId);
      if (module) {
        setCurrentQuiz(module.quiz);
        setQuizModuleTitle(`Module ${module.number}: ${module.title}`);
        setIsQuizOpen(true);
      }
    },
    [modules]
  );

  // Handle video close
  const handleCloseVideo = useCallback(() => {
    setIsVideoOpen(false);
    setCurrentLesson(null);
    setCurrentModule(null);
  }, []);

  // Handle lesson complete
  const handleLessonComplete = useCallback(
    (lessonId: string) => {
      // Award XP for completing a lesson
      addXP(20, 'Completed a lesson');
      unlockAchievement('first_lesson');

      setModules((prev) =>
        prev.map((module) => {
          const lessonIndex = module.lessons.findIndex((l) => l.id === lessonId);
          if (lessonIndex === -1) return module;

          const updatedLessons = module.lessons.map((lesson, idx) => {
            if (lesson.id === lessonId) {
              return { ...lesson, status: 'completed' as const, progress: 100 };
            }
            if (idx === lessonIndex + 1 && lesson.status === 'locked') {
              return { ...lesson, status: 'not_started' as const };
            }
            return lesson;
          });

          const completedCount = updatedLessons.filter((l) => l.status === 'completed').length;
          const moduleProgress = Math.round((completedCount / updatedLessons.length) * 100);

          const allLessonsComplete = updatedLessons.every((l) => l.status === 'completed');

          return {
            ...module,
            lessons: updatedLessons,
            progress: moduleProgress,
            status: allLessonsComplete ? 'completed' as const : 'in_progress' as const,
            quiz: allLessonsComplete && module.quiz.status === 'locked'
              ? { ...module.quiz, status: 'not_started' as const }
              : module.quiz,
          };
        })
      );

      setProgress((prev) => ({
        ...prev,
        lessonsCompleted: prev.lessonsCompleted + 1,
        overallProgress: Math.round(
          ((prev.lessonsCompleted + 1) / prev.totalLessons) * 100
        ),
        lastAccessedAt: new Date().toISOString(),
      }));
    },
    [addXP, unlockAchievement]
  );

  // Handle video progress update
  const handleProgressUpdate = useCallback(
    (lessonId: string, progressValue: number, position: number) => {
      setModules((prev) =>
        prev.map((module) => ({
          ...module,
          lessons: module.lessons.map((lesson) =>
            lesson.id === lessonId
              ? {
                  ...lesson,
                  progress: progressValue,
                  lastPosition: position,
                  status: progressValue > 0 && lesson.status === 'not_started' ? 'in_progress' : lesson.status,
                }
              : lesson
          ),
        }))
      );
    },
    []
  );

  // Handle next lesson
  const handleNextLesson = useCallback(() => {
    if (!currentModule || !currentLesson) return;

    const currentIndex = currentModule.lessons.findIndex(
      (l) => l.id === currentLesson.id
    );
    const nextLesson = currentModule.lessons[currentIndex + 1];

    if (nextLesson) {
      setCurrentLesson(nextLesson);
    } else {
      const moduleIndex = modules.findIndex((m) => m.id === currentModule.id);
      const nextModule = modules[moduleIndex + 1];

      if (nextModule && nextModule.lessons[0]) {
        setCurrentModule(nextModule);
        setCurrentLesson(nextModule.lessons[0]);
      } else {
        handleCloseVideo();
      }
    }
  }, [currentModule, currentLesson, modules, handleCloseVideo]);

  // Handle quiz close
  const handleCloseQuiz = useCallback(() => {
    setIsQuizOpen(false);
    setCurrentQuiz(null);
  }, []);

  // Handle quiz submit
  const handleQuizSubmit = useCallback(
    (score: number, _answers: Record<string, string[]>) => {
      const passed = score >= (currentQuiz?.passingScore || 70);

      if (passed) {
        addXP(50, 'Passed a quiz');
        unlockAchievement('first_quiz');
        if (score === 100) {
          unlockAchievement('perfect_quiz');
        }
      }

      setModules((prev) =>
        prev.map((module, idx) => {
          if (module.quiz.id === currentQuiz?.id) {
            return {
              ...module,
              quiz: {
                ...module.quiz,
                status: passed ? 'passed' : 'failed',
                bestScore: Math.max(module.quiz.bestScore || 0, score),
              },
              status: passed && module.progress === 100 ? 'completed' : module.status,
            };
          }

          const prevModule = prev[idx - 1];
          if (prevModule?.quiz.id === currentQuiz?.id && passed && module.status === 'locked') {
            return {
              ...module,
              status: 'not_started' as const,
              lessons: module.lessons.map((l, i) =>
                i === 0 ? { ...l, status: 'not_started' as const } : l
              ),
            };
          }

          return module;
        })
      );

      if (passed) {
        setProgress((prev) => ({
          ...prev,
          quizzesPassed: prev.quizzesPassed + 1,
          questionsAttempted:
            prev.questionsAttempted + (currentQuiz?.questions.length || 0),
          questionsCorrect:
            prev.questionsCorrect +
            Math.round(((currentQuiz?.questions.length || 0) * score) / 100),
          averageScore: Math.round(
            (prev.averageScore * prev.quizzesPassed + score) /
              (prev.quizzesPassed + 1)
          ),
          certificateEarned: prev.quizzesPassed + 1 >= prev.totalQuizzes,
        }));
      }
    },
    [currentQuiz, addXP, unlockAchievement]
  );

  // Handle review video from quiz
  const handleReviewVideo = useCallback(() => {
    handleCloseQuiz();
    const module = modules.find((m) => m.quiz.id === currentQuiz?.id);
    if (module && module.lessons[0]) {
      handlePlayLesson(module.lessons[0].id, module.id);
    }
  }, [modules, currentQuiz, handleCloseQuiz, handlePlayLesson]);

  // Handle Qubits start test
  const handleQubitsStartTest = useCallback(
    (moduleIds: string[], questionCounts: Record<string, number>) => {
      const questions = getQuestionsFromModules(moduleIds, questionCounts);

      if (questions.length === 0) {
        console.warn('No questions found for selected modules');
        return;
      }

      const selectedTitles = moduleIds
        .map((id) => {
          const mod = qubitsModules.find((m) => m.id === id);
          return mod?.title;
        })
        .filter(Boolean);

      const title = selectedTitles.length === 1
        ? selectedTitles[0]!
        : `${selectedTitles.length} Modules (${questions.length} Questions)`;

      setPracticeQuestions(questions);
      setPracticeModuleTitle(title);
      setIsPracticeOpen(true);
    },
    [qubitsModules]
  );

  // Handle Qubits practice complete
  const handlePracticeComplete = useCallback(
    (score: number, totalTime: number, results: { questionId: string; isCorrect: boolean }[]) => {
      const totalQuestions = results.length;
      const correctCount = results.filter((r) => r.isCorrect).length;

      // Award XP based on performance
      addXP(Math.round(score / 4), 'Completed practice test');

      setQubitsDashboard((prev) => {
        const newTotalAttempted = prev.totalQuestionsAttempted + totalQuestions;
        const prevCorrect = Math.round((prev.overallAccuracy / 100) * prev.totalQuestionsAttempted);
        const newTotalCorrect = prevCorrect + correctCount;
        const newAccuracy = newTotalAttempted > 0 ? Math.round((newTotalCorrect / newTotalAttempted) * 100) : 0;

        const timeMatch = prev.timeSpent.match(/(\d+)h\s*(\d+)?m?/);
        const prevHours = timeMatch ? parseInt(timeMatch[1]) : 0;
        const prevMins = timeMatch && timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const prevTotalMins = prevHours * 60 + prevMins;
        const newTotalMins = prevTotalMins + Math.round(totalTime / 60);
        const newHours = Math.floor(newTotalMins / 60);
        const newMins = newTotalMins % 60;
        const newTimeSpent = newMins > 0 ? `${newHours}h ${newMins}m` : `${newHours}h`;

        return {
          ...prev,
          totalQuizzes: prev.totalQuizzes + 1,
          totalQuestionsAttempted: newTotalAttempted,
          overallAccuracy: newAccuracy,
          timeSpent: newTimeSpent,
          streak: score >= 70 ? prev.streak + 1 : 0,
          lastPracticeDate: new Date().toISOString(),
        };
      });

      setQubitsModules((prev) =>
        prev.map((mod) => {
          const modulePrefix = mod.id.replace('qubits-', 'qb');
          const moduleQuestions = results.filter((r) => r.questionId.startsWith(modulePrefix));

          if (moduleQuestions.length === 0) return mod;

          const moduleCorrect = moduleQuestions.filter((r) => r.isCorrect).length;
          const newAttempted = mod.attemptedQuestions + moduleQuestions.length;
          const newCorrect = mod.correctAnswers + moduleCorrect;
          const newAccuracy = newAttempted > 0 ? Math.round((newCorrect / newAttempted) * 100) : 0;

          return {
            ...mod,
            attemptedQuestions: newAttempted,
            correctAnswers: newCorrect,
            incorrectAnswers: mod.incorrectAnswers + (moduleQuestions.length - moduleCorrect),
            unattempted: Math.max(0, mod.totalQuestions - newAttempted),
            accuracy: newAccuracy,
          };
        })
      );
    },
    [addXP]
  );

  // Handle Qubits reset
  const handleQubitsReset = useCallback(() => {
    setQubitsModules(initialQubitsModulesData);
    setQubitsDashboard(initialQubitsDashboardData);
  }, []);

  // Handle load mock progress (Show Progress button)
  const handleLoadMockProgress = useCallback(() => {
    // Load demo data with progress
    setModules(demoModules);
    setProgress(demoProgress);
    setQubitsModules(demoQubitsModules);
    setQubitsDashboard(demoQubitsDashboard);

    // Mark that demo data was loaded
    setIsCleanSlate(false);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify({
        loaded: true,
        timestamp: new Date().toISOString()
      }));
    }

    // Show notification
    showWIP('Mock progress data loaded! You can now explore the dashboard with sample data.');
  }, [showWIP]);

  // Handle share progress
  const handleShareProgress = () => {
    const text = `I'm making great progress on my AZ-104 Azure Administrator certification! 🎯 Currently at ${progress.overallProgress}% completion with a ${streak}-day learning streak! #Azure #CloudComputing #Learning`;
    if (navigator.share) {
      navigator.share({ title: 'My Learning Progress', text });
    } else {
      navigator.clipboard.writeText(text);
      showWIP('Progress copied to clipboard! Share it on LinkedIn or social media.');
    }
  };

  // Handle share achievement (for Qubits)
  const handleShareAchievement = () => {
    const text = `🏆 Achievement Unlocked! I've completed ${qubitsDashboard.totalQuestionsAttempted} practice questions on Azure AZ-104 with ${qubitsDashboard.overallAccuracy}% accuracy! Preparing for certification the smart way. #Azure #CloudComputing #Learning #Microsoft`;
    if (navigator.share) {
      navigator.share({
        title: 'My Qubits Achievement',
        text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(text);
      showWIP('Achievement copied to clipboard! Share your success on LinkedIn.');
    }
  };

  // Handle request badge
  const handleRequestBadge = () => {
    if (qubitsDashboard.overallAccuracy >= 80) {
      showWIP('Badge request submitted! You will receive your digital badge via email within 24-48 hours.');
      addXP(100, 'Requested achievement badge');
    } else {
      showWIP(`You need 80%+ accuracy to request a badge. Current: ${qubitsDashboard.overallAccuracy}%`);
    }
  };

  // Tour is now auto-started by TourProvider for first-time visitors
  // No need for duplicate auto-start logic here

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'course':
        return (
          <ModuleList
            modules={modules}
            onPlayLesson={handlePlayLesson}
            onStartQuiz={handleStartQuiz}
          />
        );
      case 'qubits':
        return (
          <QubitsSection
            modules={qubitsModules}
            dashboard={qubitsDashboard}
            onStartTest={handleQubitsStartTest}
            onReset={handleQubitsReset}
            onShareAchievement={handleShareAchievement}
            onRequestBadge={handleRequestBadge}
          />
        );
      case 'resources':
        return <ResourcesSection resources={resources} />;
      case 'support':
        return <SupportSection trainer={trainer} />;
      case 'certificate':
        return (
          <CertificateSection
            progress={progress}
            course={course}
            learner={learnerProfile}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PWC Branding Banner */}
      {isCustomBranded && (
        <div
          className="w-full py-2 px-4 text-center text-white text-sm"
          style={{ backgroundColor: theme.primaryColor }}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="font-semibold">{theme.name}</span>
            <span className="opacity-75">×</span>
            <span>Koenig Solutions</span>
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
                onClick={() => setIsAIAssistantOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm hover:bg-violet-200 transition-colors"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">AI Assistant</span>
              </button>
              <button
                onClick={() => setIsFocusModeOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm hover:bg-indigo-200 transition-colors"
              >
                <Timer className="w-4 h-4" />
                <span className="hidden sm:inline">Focus Mode</span>
              </button>
              <button
                onClick={() => setIsExamPrepOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors"
              >
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Exam Prep</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CourseHeader course={course} progress={progress} />

        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          certificateEarned={progress.certificateEarned}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3" data-tour="modules">{renderTabContent()}</div>
          <div className="lg:col-span-1 space-y-6">
            <div data-tour="progress-sidebar">
              <ProgressSidebar progress={progress} qubitsDashboard={qubitsDashboard} />
            </div>

            {/* Gamification Widget */}
            <div data-tour="gamification">
              <GamificationWidget />
            </div>

            {/* Quick Tools */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" data-tour="quick-tools">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsBookmarksOpen(true)}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Bookmark className="w-5 h-5 text-cyan-600" />
                  <span className="text-xs text-gray-600">Bookmarks</span>
                </button>
                <button
                  onClick={() => setIsCalendarOpen(true)}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Calendar className="w-5 h-5 text-cyan-600" />
                  <span className="text-xs text-gray-600">Calendar</span>
                </button>
                <button
                  onClick={() => setIsSpacedRepOpen(true)}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span className="text-xs text-gray-600">Flashcards</span>
                </button>
                <button
                  onClick={() => setIsMindMapOpen(true)}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Network className="w-5 h-5 text-green-600" />
                  <span className="text-xs text-gray-600">Mind Map</span>
                </button>
                <button
                  onClick={() => setIsSocialHubOpen(true)}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-xs text-gray-600">Community</span>
                </button>
                <button
                  onClick={() => setIsAnalyticsOpen(true)}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs text-gray-600">Analytics</span>
                </button>
              </div>

              {/* Share Progress */}
              <button
                onClick={handleShareProgress}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-colors"
                data-tour="share-progress"
              >
                <Share2 className="w-4 h-4" />
                Share My Progress
              </button>

              {/* Help / Tour Button with Koey Mascot */}
              <button
                onClick={() => startTour()}
                className="w-full mt-4 flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-white rounded-xl hover:from-cyan-600 hover:via-blue-600 hover:to-violet-600 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] group"
                data-tour="tour-button"
              >
                {/* Mini Koey mascot */}
                <div className="w-7 h-7 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full group-hover:animate-bounce">
                    <circle cx="50" cy="40" r="28" fill="white" />
                    <circle cx="38" cy="38" r="5" fill="#06b6d4" />
                    <circle cx="62" cy="38" r="5" fill="#06b6d4" />
                    <circle cx="40" cy="36" r="2" fill="white" />
                    <circle cx="64" cy="36" r="2" fill="white" />
                    <path d="M45 50 L50 58 L55 50 Z" fill="#f59e0b" />
                    <path d="M25 22 L50 12 L75 22 L50 32 Z" fill="#1e3a5f" />
                  </svg>
                </div>
                <span className="font-medium">Tour with Koey</span>
                <HelpCircle className="w-4 h-4 opacity-70" />
              </button>

              {/* Keyboard Shortcuts */}
              <button
                onClick={() => setIsShortcutsOpen(true)}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2 text-gray-500 hover:text-gray-700 text-sm"
              >
                <Keyboard className="w-4 h-4" />
                Keyboard Shortcuts (?)
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Video Player Modal */}
      {isVideoOpen && currentLesson && currentModule && (
        useYouTube ? (
          <YouTubePlayer
            isOpen={isVideoOpen}
            onClose={handleCloseVideo}
            lesson={currentLesson}
            module={currentModule}
            courseName={course.name}
            onComplete={handleLessonComplete}
            onProgressUpdate={handleProgressUpdate}
            onNextLesson={
              currentModule.lessons.findIndex((l) => l.id === currentLesson.id) <
              currentModule.lessons.length - 1
                ? handleNextLesson
                : undefined
            }
          />
        ) : (
          <VideoPlayer
            isOpen={isVideoOpen}
            onClose={handleCloseVideo}
            lesson={currentLesson}
            module={currentModule}
            courseName={course.name}
            onComplete={handleLessonComplete}
            onProgressUpdate={handleProgressUpdate}
            onNextLesson={
              currentModule.lessons.findIndex((l) => l.id === currentLesson.id) <
              currentModule.lessons.length - 1
                ? handleNextLesson
                : undefined
            }
          />
        )
      )}

      {/* Quiz Modal */}
      {isQuizOpen && currentQuiz && (
        <QuizModal
          isOpen={isQuizOpen}
          onClose={handleCloseQuiz}
          quiz={currentQuiz}
          moduleTitle={quizModuleTitle}
          onSubmit={handleQuizSubmit}
          onReviewVideo={handleReviewVideo}
        />
      )}

      {/* Qubits Practice Test Modal */}
      {isPracticeOpen && practiceQuestions.length > 0 && (
        <QubitsPracticeModal
          isOpen={isPracticeOpen}
          onClose={() => setIsPracticeOpen(false)}
          questions={practiceQuestions}
          moduleTitle={practiceModuleTitle}
          onComplete={handlePracticeComplete}
        />
      )}

      {/* Feature Modals */}
      <AIStudyAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
      />

      <BookmarksNotesPanel
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
      />

      <FocusMode
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
      />

      <SocialHub
        isOpen={isSocialHubOpen}
        onClose={() => setIsSocialHubOpen(false)}
      />

      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      <StudyCalendar
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />

      <SpacedRepetition
        isOpen={isSpacedRepOpen}
        onClose={() => setIsSpacedRepOpen(false)}
      />

      <MindMap
        isOpen={isMindMapOpen}
        onClose={() => setIsMindMapOpen(false)}
      />

      <ExamPrep
        isOpen={isExamPrepOpen}
        onClose={() => setIsExamPrepOpen(false)}
      />

      <KeyboardShortcuts
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Celebration Overlay */}
      <CelebrationOverlay />

      {/* WIP Popup */}
      <WIPPopup
        isOpen={wipState.isOpen}
        onClose={hideWIP}
        featureName={wipState.featureName}
      />
    </div>
  );
}
