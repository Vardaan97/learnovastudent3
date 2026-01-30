'use client';

/**
 * Learnova Course Dashboard (R2-Only Mode)
 *
 * Shows only modules that have R2-hosted videos and MCQ questions.
 * This provides a clean, complete learning experience without YouTube placeholders.
 */

import React, { useState, useCallback, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import CourseHeader from '@/components/CourseHeader';
import TabNavigation from '@/components/TabNavigation';
import ModuleList from '@/components/ModuleList';
import VideoPlayer from '@/components/VideoPlayer';
import QuizModal from '@/components/QuizModal';
import QubitsPracticeModal from '@/components/QubitsPracticeModal';
import ProgressSidebar from '@/components/ProgressSidebar';
import QubitsSection from '@/components/QubitsSection';
import CertificateSection from '@/components/CertificateSection';
import GamificationWidget from '@/components/GamificationWidget';
import CelebrationOverlay from '@/components/CelebrationOverlay';
import WIPPopup, { useWIP } from '@/components/WIPPopup';

import { useGamification } from '@/context/GamificationContext';
import { useAuth } from '@/context/AuthContext';
import { useEngagementTime, formatTimeSpent } from '@/hooks/useEngagementTime';
import type {
  TabId,
  Lesson,
  Module,
  Quiz,
  QuizQuestion,
  QubitsModule,
  QubitsDashboard,
  Course,
  LearnerProgress,
  LearnerProfile,
  Notification,
} from '@/types';
import {
  Loader2,
  ArrowLeft,
  Share2,
  Flame,
  AlertCircle,
} from 'lucide-react';

// Default learner profile
const defaultLearnerProfile: LearnerProfile = {
  id: 'learner-001',
  name: 'Demo Learner',
  email: 'learner@koenig.com',
  learnerId: 'DEMO-2026-001',
  enrolledDate: new Date().toISOString().split('T')[0],
  organization: 'Koenig Solutions',
};

export default function LearnovaCourseDashboard({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const resolvedParams = use(params);
  const courseCode = decodeURIComponent(resolvedParams.code);

  const { addXP, level, streak, xp, unlockAchievement } = useGamification();
  const { wipState, showWIP, hideWIP } = useWIP();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Generate unique storage key based on user ID
  const userId = user?.id || 'anonymous';
  const storageKey = `learnova-progress-${userId}-${courseCode}`;

  // Check if user has access to this course
  const hasAccess = useMemo(() => {
    // If no user or user has no restrictions, allow access
    if (!user || !user.allowedCourses) return true;
    // Check if course code is in allowed list
    return user.allowedCourses.includes(courseCode);
  }, [user, courseCode]);

  // Redirect if not authenticated or no access
  useEffect(() => {
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Redirect to allowed course if user doesn't have access to this one
    if (!hasAccess && user?.allowedCourses && user.allowedCourses.length > 0) {
      router.replace(`/learnova/${user.allowedCourses[0]}`);
    }
  }, [authLoading, isAuthenticated, hasAccess, user, router]);

  // Data state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [qubitsModules, setQubitsModules] = useState<QubitsModule[]>([]);
  const [qubitsDashboard, setQubitsDashboard] = useState<QubitsDashboard | null>(null);
  const [progress, setProgress] = useState<LearnerProgress | null>(null);
  const [notifications] = useState<Notification[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<TabId>('course');
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizModuleTitle, setQuizModuleTitle] = useState('');
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState<QuizQuestion[]>([]);
  const [practiceModuleTitle, setPracticeModuleTitle] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'lesson' | 'module' | 'quiz' | 'course'>('lesson');
  const [celebrationXP, setCelebrationXP] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Engagement time tracking with idle detection and tab visibility
  const { formattedTime: engagementTime } = useEngagementTime({
    storageKey: `engagement-${userId}-${courseCode}`,
    idleThreshold: 30000, // 30 seconds
    autoSaveInterval: 30000, // Save every 30s
    isVideoPlaying,
    isQuizActive: isQuizOpen || isPracticeOpen,
    onTimeUpdate: (seconds) => {
      setProgress((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          totalTimeSpent: formatTimeSpent(seconds),
        };
      });
    },
  });

  // Load course data from R2-only API
  useEffect(() => {
    async function loadCourse() {
      setIsLoading(true);

      try {
        const res = await fetch(`/api/courses/${encodeURIComponent(courseCode)}/r2-only`);
        const data = await res.json();

        if (data.success) {
          setCourse(data.data.course);

          // Try to load saved progress from localStorage (using per-user key)
          const savedProgressStr = localStorage.getItem(storageKey);
          let savedProgress: {
            modules?: Module[];
            qubitsModules?: QubitsModule[];
            qubitsDashboard?: QubitsDashboard;
            progress?: LearnerProgress;
            savedAt?: string;
          } | null = null;

          if (savedProgressStr) {
            try {
              savedProgress = JSON.parse(savedProgressStr);
            } catch (e) {
              console.warn('Failed to parse saved progress:', e);
            }
          }

          // If we have saved progress, merge it with fresh data
          if (savedProgress?.modules && savedProgress.modules.length === data.data.modules.length) {
            // Merge saved module progress with fresh module data (to get any new questions)
            const mergedModules = data.data.modules.map((freshMod: Module, idx: number) => {
              const savedMod = savedProgress?.modules?.[idx];
              if (savedMod) {
                return {
                  ...freshMod,
                  status: savedMod.status,
                  progress: savedMod.progress,
                  lessons: freshMod.lessons.map((lesson: Lesson, lessonIdx: number) => ({
                    ...lesson,
                    status: savedMod.lessons[lessonIdx]?.status || lesson.status,
                    progress: savedMod.lessons[lessonIdx]?.progress || lesson.progress,
                    lastPosition: savedMod.lessons[lessonIdx]?.lastPosition || lesson.lastPosition,
                  })),
                  quiz: {
                    ...freshMod.quiz,
                    status: savedMod.quiz?.status || freshMod.quiz.status,
                    bestScore: savedMod.quiz?.bestScore || freshMod.quiz.bestScore,
                  },
                };
              }
              return freshMod;
            });
            setModules(mergedModules);
            setQubitsModules(savedProgress.qubitsModules || data.data.qubitsModules);
            setQubitsDashboard(savedProgress.qubitsDashboard || data.data.qubitsDashboard);
            setProgress(savedProgress.progress || data.data.learnerProgress);
          } else {
            // No saved progress or module count mismatch - start fresh
            // Update module status for proper unlock flow
            const updatedModules = data.data.modules.map((mod: Module, idx: number) => ({
              ...mod,
              status: idx === 0 ? 'in_progress' : 'locked',
              // Unlock ALL lessons in the first module, lock lessons in other modules
              lessons: mod.lessons.map((lesson: Lesson) => ({
                ...lesson,
                status: idx === 0 ? 'not_started' : 'locked',
              })),
              quiz: {
                ...mod.quiz,
                status: 'locked',
              },
            }));

            setModules(updatedModules);
            setQubitsModules(data.data.qubitsModules);
            setQubitsDashboard(data.data.qubitsDashboard);
            setProgress(data.data.learnerProgress);
          }
          setError(null);
        } else {
          setError(data.error || 'Failed to load course');
        }
      } catch (err) {
        setError('Failed to load course data');
      } finally {
        setIsLoading(false);
      }
    }
    loadCourse();
  }, [courseCode]);

  const triggerCelebration = useCallback(
    (type: 'lesson' | 'module' | 'quiz' | 'course', earnedXP: number) => {
      setCelebrationType(type);
      setCelebrationXP(earnedXP);
      setShowCelebration(true);
    },
    []
  );

  const findLessonAndModule = useCallback(
    (lessonId: string, moduleId: string) => {
      const module = modules.find((m) => m.id === moduleId);
      const lesson = module?.lessons.find((l) => l.id === lessonId);
      return { module, lesson };
    },
    [modules]
  );

  const handlePlayLesson = useCallback(
    (lessonId: string, moduleId: string) => {
      const { module, lesson } = findLessonAndModule(lessonId, moduleId);
      if (lesson && module) {
        if (lesson.status === 'locked') {
          showWIP('Complete the previous lessons to unlock this one.');
          return;
        }
        setCurrentLesson(lesson);
        setCurrentModule(module);
        setIsVideoOpen(true);
      }
    },
    [findLessonAndModule, showWIP]
  );

  const handleLessonComplete = useCallback(
    (lessonId: string) => {
      const xpEarned = 25;
      addXP(xpEarned, 'Completed lesson');

      setModules((prevModules) => {
        const updatedModules = prevModules.map((module) => {
          const lessonIndex = module.lessons.findIndex((l) => l.id === lessonId);
          if (lessonIndex === -1) return module;

          const lessonIdx = module.lessons.findIndex((l) => l.id === lessonId);
          const updatedLessons = module.lessons.map((lesson, idx) => {
            if (lesson.id === lessonId) {
              return { ...lesson, status: 'completed' as const, progress: 100 };
            }
            // Unlock the next lesson in the same module when current lesson completes
            if (idx === lessonIdx + 1 && lesson.status === 'locked') {
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
            status: allLessonsCompleted ? ('completed' as const) : ('in_progress' as const),
            quiz: newQuiz,
          };
        });

        // Unlock next module when previous module reaches 70% progress
        return updatedModules.map((module, index) => {
          const prevModule = updatedModules[index - 1];
          if (
            prevModule &&
            prevModule.lessons.some((l) => l.id === lessonId) &&
            prevModule.progress >= 70 &&
            module.status === 'locked'
          ) {
            return {
              ...module,
              status: 'not_started' as const,
              // Unlock ALL lessons in the next module (not just the first)
              lessons: module.lessons.map((l) => ({ ...l, status: 'not_started' as const })),
            };
          }
          return module;
        });
      });

      setProgress((prev) => {
        if (!prev) return prev;
        const completedLessons = prev.lessonsCompleted + 1;
        return {
          ...prev,
          overallProgress: Math.round((completedLessons / prev.totalLessons) * 100),
          lessonsCompleted: completedLessons,
          lastAccessedAt: new Date().toISOString(),
        };
      });

      triggerCelebration('lesson', xpEarned);
    },
    [addXP, triggerCelebration]
  );

  // Save progress to localStorage whenever modules or progress changes
  useEffect(() => {
    if (!modules.length || !progress || !qubitsDashboard) return;

    const savedData = {
      modules,
      qubitsModules,
      qubitsDashboard,
      progress,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(storageKey, JSON.stringify(savedData));
  }, [modules, qubitsModules, qubitsDashboard, progress, storageKey]);

  const handleVideoProgress = useCallback(
    (lessonId: string, progressPercent: number, position: number) => {
      setModules((prevModules) => {
        const updatedModules = prevModules.map((module) => {
          // Check if this lesson belongs to this module
          const lessonInModule = module.lessons.some((l) => l.id === lessonId);

          const updatedLessons = module.lessons.map((lesson) =>
            lesson.id === lessonId
              ? {
                  ...lesson,
                  progress: Math.max(lesson.progress, progressPercent),
                  lastPosition: Math.max(lesson.lastPosition || 0, position),
                  status: lesson.status === 'not_started' ? ('in_progress' as const) : lesson.status,
                }
              : lesson
          );

          // Calculate module progress based on lesson progress
          const moduleProgress = lessonInModule
            ? Math.round(updatedLessons.reduce((sum, l) => sum + l.progress, 0) / updatedLessons.length)
            : module.progress;

          return {
            ...module,
            lessons: updatedLessons,
            progress: moduleProgress,
          };
        });

        // Calculate overall progress based on all lesson progress
        const totalLessons = updatedModules.reduce((sum, m) => sum + m.lessons.length, 0);
        const totalProgress = updatedModules.reduce(
          (sum, m) => sum + m.lessons.reduce((ls, l) => ls + l.progress, 0),
          0
        );
        const overallProgress = totalLessons > 0 ? Math.round(totalProgress / totalLessons) : 0;

        // Update progress state (time is now tracked by useEngagementTime hook)
        setProgress((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            overallProgress,
            lastAccessedAt: new Date().toISOString(),
          };
        });

        return updatedModules;
      });
    },
    []
  );

  const handleStartQuiz = useCallback(
    (quizId: string, moduleId: string) => {
      const module = modules.find((m) => m.id === moduleId);
      if (module) {
        if (module.quiz.status === 'locked') {
          showWIP('Complete the video lesson to unlock the quiz.');
          return;
        }
        setCurrentQuiz(module.quiz);
        setQuizModuleTitle(`Module ${module.number}: ${module.title}`);
        setIsQuizOpen(true);
      }
    },
    [modules, showWIP]
  );

  const handleCloseQuiz = useCallback(() => {
    setIsQuizOpen(false);
    setCurrentQuiz(null);
  }, []);

  const handleQuizSubmit = useCallback(
    (score: number, answers: Record<string, string[]>) => {
      const passed = score >= (currentQuiz?.passingScore || 70);

      // Calculate questions statistics from the answers
      const totalQuestions = currentQuiz?.questions?.length || 0;
      let correctCount = 0;

      if (currentQuiz?.questions) {
        currentQuiz.questions.forEach((question) => {
          const userAnswer = answers[question.id] || [];
          const isCorrect =
            userAnswer.length === question.correctOptionIds.length &&
            userAnswer.every((id) => question.correctOptionIds.includes(id));
          if (isCorrect) correctCount++;
        });
      }

      if (passed) {
        addXP(50, 'Passed a quiz');
        unlockAchievement('first_quiz');
      }

      setModules((prev) =>
        prev.map((module, idx) => {
          if (module.quiz.id === currentQuiz?.id) {
            return {
              ...module,
              quiz: {
                ...module.quiz,
                status: passed ? ('passed' as const) : ('failed' as const),
                bestScore: Math.max(module.quiz.bestScore || 0, score),
              },
            };
          }

          const prevModule = prev[idx - 1];
          if (
            prevModule?.quiz.id === currentQuiz?.id &&
            passed &&
            module.status === 'locked'
          ) {
            return {
              ...module,
              status: 'not_started' as const,
              // Unlock ALL lessons in the next module (not just the first)
              lessons: module.lessons.map((l) => ({ ...l, status: 'not_started' as const })),
            };
          }

          return module;
        })
      );

      setProgress((prev) => {
        if (!prev) return prev;

        const newQuestionsAttempted = (prev.questionsAttempted || 0) + totalQuestions;
        const newQuestionsCorrect = (prev.questionsCorrect || 0) + correctCount;
        const newQuizzesPassed = passed ? prev.quizzesPassed + 1 : prev.quizzesPassed;

        return {
          ...prev,
          quizzesPassed: newQuizzesPassed,
          questionsAttempted: newQuestionsAttempted,
          questionsCorrect: newQuestionsCorrect,
          averageScore: newQuestionsAttempted > 0
            ? Math.round((newQuestionsCorrect / newQuestionsAttempted) * 100)
            : 0,
          lastAccessedAt: new Date().toISOString(),
        };
      });

      if (passed) {
        triggerCelebration('quiz', 50);
      }
    },
    [currentQuiz, addXP, unlockAchievement, triggerCelebration]
  );

  const handleReviewVideo = useCallback(() => {
    handleCloseQuiz();
    const module = modules.find((m) => m.quiz.id === currentQuiz?.id);
    if (module && module.lessons[0]) {
      handlePlayLesson(module.lessons[0].id, module.id);
    }
  }, [modules, currentQuiz, handleCloseQuiz, handlePlayLesson]);

  const handleVideoPlayStateChange = useCallback((playing: boolean) => {
    setIsVideoPlaying(playing);
  }, []);

  const handleQubitsStartTest = useCallback(
    (moduleIds: string[], questionCounts: Record<string, number>) => {
      const allQuestions: QuizQuestion[] = [];

      moduleIds.forEach((modId) => {
        const moduleNum = parseInt(modId.replace('qubits-', ''));
        const module = modules.find((m) => m.number === moduleNum);
        if (module?.quiz?.questions) {
          const count = questionCounts[modId] || 10;
          allQuestions.push(...module.quiz.questions.slice(0, count));
        }
      });

      if (allQuestions.length === 0) {
        showWIP('No practice questions available for the selected modules.');
        return;
      }

      const selectedTitles = moduleIds
        .map((id) => qubitsModules.find((m) => m.id === id)?.subtitle)
        .filter(Boolean)
        .join(', ');

      setPracticeQuestions(allQuestions);
      setPracticeModuleTitle(selectedTitles || 'Practice Test');
      setIsPracticeOpen(true);
    },
    [modules, qubitsModules, showWIP]
  );

  const handlePracticeComplete = useCallback(
    (score: number, totalTime: number, results: { questionId: string; isCorrect: boolean }[]) => {
      const xpEarned = Math.round(score / 4);
      addXP(xpEarned, 'Completed practice test');

      // Calculate statistics from results
      const correctCount = results.filter(r => r.isCorrect).length;
      const incorrectCount = results.length - correctCount;
      const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

      // Update qubitsModules state to reflect completion
      setQubitsModules(prev => prev.map(mod => {
        // Check if any of the practice questions belong to this module
        const moduleQuestions = practiceQuestions.filter(q => {
          const moduleNum = parseInt(mod.id.replace('qubits-', ''));
          return q.questionNumber <= (mod.totalQuestions || 10);
        });

        if (moduleQuestions.length > 0) {
          const modCorrect = results.filter(r =>
            moduleQuestions.some(q => q.id === r.questionId) && r.isCorrect
          ).length;
          const modIncorrect = results.filter(r =>
            moduleQuestions.some(q => q.id === r.questionId) && !r.isCorrect
          ).length;
          const modAttempted = modCorrect + modIncorrect;

          return {
            ...mod,
            attemptedQuestions: mod.attemptedQuestions + modAttempted,
            correctAnswers: mod.correctAnswers + modCorrect,
            incorrectAnswers: mod.incorrectAnswers + modIncorrect,
            unattempted: Math.max(0, mod.totalQuestions - (mod.attemptedQuestions + modAttempted)),
            accuracy: modAttempted > 0
              ? Math.round(((mod.correctAnswers + modCorrect) / (mod.attemptedQuestions + modAttempted)) * 100)
              : mod.accuracy,
          };
        }
        return mod;
      }));

      // Update qubitsDashboard statistics
      setQubitsDashboard(prev => {
        if (!prev) return prev;
        const newTotalAttempted = prev.totalQuestionsAttempted + results.length;
        const prevCorrect = Math.round(prev.totalQuestionsAttempted * prev.overallAccuracy / 100);
        const newCorrect = prevCorrect + correctCount;

        // Parse existing time spent and add new time
        const parseTimeSpent = (timeStr: string): number => {
          const hourMatch = timeStr.match(/(\d+)h/);
          const minMatch = timeStr.match(/(\d+)m/);
          const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
          const minutes = minMatch ? parseInt(minMatch[1]) : 0;
          return hours * 3600 + minutes * 60;
        };

        const formatTimeSpent = (seconds: number): string => {
          if (seconds < 60) return '0m';
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          if (hours > 0) {
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
          }
          return `${minutes}m`;
        };

        const existingSeconds = parseTimeSpent(prev.timeSpent);
        const newTotalSeconds = existingSeconds + totalTime;

        return {
          ...prev,
          totalQuizzes: prev.totalQuizzes + 1,
          totalQuestionsAttempted: newTotalAttempted,
          overallAccuracy: newTotalAttempted > 0 ? Math.round((newCorrect / newTotalAttempted) * 100) : 0,
          timeSpent: formatTimeSpent(newTotalSeconds),
          lastPracticeDate: new Date().toISOString(),
        };
      });

      // Update progress
      setProgress(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          quizzesPassed: prev.quizzesPassed + (accuracy >= 70 ? 1 : 0),
          questionsAttempted: (prev.questionsAttempted || 0) + results.length,
          questionsCorrect: (prev.questionsCorrect || 0) + correctCount,
          lastAccessedAt: new Date().toISOString(),
        };
      });

      // Save progress to localStorage (using per-user key)
      const savedProgress = {
        modules,
        qubitsModules,
        qubitsDashboard,
        progress,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(savedProgress));

      if (accuracy >= 70) {
        triggerCelebration('quiz', xpEarned);
      }

      setIsPracticeOpen(false);
    },
    [addXP, storageKey, modules, practiceQuestions, qubitsModules, qubitsDashboard, progress, triggerCelebration]
  );

  const handleNextLesson = useCallback(() => {
    if (!currentModule || !currentLesson) return;

    const currentLessonIndex = currentModule.lessons.findIndex((l) => l.id === currentLesson.id);

    // Try next lesson in same module
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      const nextLesson = currentModule.lessons[currentLessonIndex + 1];
      if (nextLesson.status !== 'locked') {
        // Close and reopen video to force reload
        setIsVideoOpen(false);
        setTimeout(() => {
          setCurrentLesson(nextLesson);
          setIsVideoOpen(true);
        }, 100);
        return;
      }
    }

    // Try first lesson of next module
    const currentModuleIndex = modules.findIndex((m) => m.id === currentModule.id);
    if (currentModuleIndex < modules.length - 1) {
      const nextModule = modules[currentModuleIndex + 1];
      if (nextModule.status !== 'locked' && nextModule.lessons[0]?.status !== 'locked') {
        setIsVideoOpen(false);
        setTimeout(() => {
          setCurrentModule(nextModule);
          setCurrentLesson(nextModule.lessons[0]);
          setIsVideoOpen(true);
        }, 100);
      }
    }
  }, [currentModule, currentLesson, modules]);

  const handleShareProgress = () => {
    const text = `I'm learning ${course?.name || 'a course'} on Learnova! Currently at ${progress?.overallProgress || 0}% completion.`;
    if (navigator.share) {
      navigator.share({ title: 'My Learning Progress', text });
    } else {
      navigator.clipboard.writeText(text);
      showWIP('Progress copied to clipboard!');
    }
  };

  const handleQubitsReset = useCallback(() => {
    // Reset all qubits modules to fresh state
    setQubitsModules(prev => prev.map(mod => ({
      ...mod,
      attemptedQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      unattempted: mod.totalQuestions,
      isSelected: false,
    })));

    // Reset dashboard statistics
    setQubitsDashboard(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        overallAccuracy: 0,
        totalQuestionsAttempted: 0,
        timeSpent: '0h 0m',
        streak: 0,
      };
    });

    // Reset quiz-related progress
    setProgress(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        quizzesPassed: 0,
        averageScore: 0,
      };
    });

    // Clear localStorage for this course (using per-user key)
    localStorage.removeItem(storageKey);

    showWIP('All Qubits progress has been reset!');
  }, [storageKey, showWIP]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course || !progress || !qubitsDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-red-200 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Course</h2>
          <p className="text-gray-500 mb-6">{error || 'Unknown error'}</p>
          <Link
            href="/learnova"
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course Selector
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CelebrationOverlay />

      <Header
        learner={defaultLearnerProfile}
        notifications={notifications}
        onMarkNotificationRead={() => {}}
      />

      {/* Quick Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <GamificationWidget compact />

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareProgress}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>

              <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-medium">{streak} day streak</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <CourseHeader course={course} progress={progress} />

            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              certificateEarned={progress.certificateEarned}
            />

            <div className="mt-6">
              {activeTab === 'course' && (
                <ModuleList
                  modules={modules}
                  onPlayLesson={handlePlayLesson}
                  onStartQuiz={handleStartQuiz}
                />
              )}

              {activeTab === 'qubits' && (
                <QubitsSection
                  modules={qubitsModules}
                  dashboard={qubitsDashboard}
                  onStartTest={handleQubitsStartTest}
                  onReset={handleQubitsReset}
                />
              )}

              {activeTab === 'certificate' && (
                <CertificateSection
                  course={course}
                  progress={progress}
                  learner={defaultLearnerProfile}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <ProgressSidebar progress={progress} qubitsDashboard={qubitsDashboard} />
          </div>
        </div>
      </main>

      {/* Video Player */}
      {isVideoOpen && currentLesson && currentModule && (
        <VideoPlayer
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
          lesson={currentLesson}
          module={currentModule}
          courseName={course.name}
          onComplete={handleLessonComplete}
          onProgressUpdate={handleVideoProgress}
          onNextLesson={handleNextLesson}
          onPlayStateChange={handleVideoPlayStateChange}
        />
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

      {/* Qubits Practice Modal */}
      <QubitsPracticeModal
        isOpen={isPracticeOpen}
        onClose={() => setIsPracticeOpen(false)}
        questions={practiceQuestions}
        moduleTitle={practiceModuleTitle}
        onComplete={handlePracticeComplete}
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
