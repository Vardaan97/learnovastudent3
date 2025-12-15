/**
 * Progress Sync Hook
 * ==================
 *
 * Syncs learner progress with Supabase database in real-time.
 * Handles video progress, quiz attempts, and enrollment updates.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  lessonProgressService,
  quizAttemptService,
  enrollmentService,
  gamificationService,
  isSupabaseConfigured
} from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Debounce helper for progress updates
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

interface UseProgressSyncOptions {
  enrollmentId?: string;
  courseId?: string;
  onProgressUpdate?: (lessonId: string, progress: number) => void;
  onLessonComplete?: (lessonId: string) => void;
}

export function useProgressSync(options: UseProgressSyncOptions = {}) {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingUpdates = useRef<Map<string, { progress: number; position: number; duration: number }>>(new Map());

  // Save video progress to database (debounced)
  const saveVideoProgress = useCallback(
    debounce(async (lessonId: string, progress: number, position: number, watchedDuration: number) => {
      if (!user?.id || !isSupabaseConfigured()) {
        // Save to localStorage as fallback
        const key = `lesson_progress_${user?.id || 'demo'}_${lessonId}`;
        localStorage.setItem(key, JSON.stringify({ progress, position, watchedDuration, updatedAt: new Date().toISOString() }));
        return;
      }

      try {
        // Ensure lesson progress record exists
        await lessonProgressService.getOrCreate(user.id, lessonId, options.enrollmentId || '');

        // Update progress
        await lessonProgressService.updateProgress(user.id, lessonId, progress, position, watchedDuration);

        // Update gamification streak
        await gamificationService.updateStreak(user.id);

        console.log(`[ProgressSync] Saved progress for lesson ${lessonId}: ${progress}%`);
      } catch (error) {
        console.error('[ProgressSync] Failed to save video progress:', error);
      }
    }, 2000), // Debounce for 2 seconds
    [user?.id, options.enrollmentId]
  );

  // Mark lesson as complete
  const markLessonComplete = useCallback(async (lessonId: string) => {
    if (!user?.id) return;

    try {
      if (isSupabaseConfigured()) {
        await lessonProgressService.markCompleted(user.id, lessonId);
        await gamificationService.incrementLessonsCompleted(user.id);
        await gamificationService.addXP(user.id, 20); // Award XP for completing lesson
      }

      options.onLessonComplete?.(lessonId);
      console.log(`[ProgressSync] Lesson ${lessonId} marked as complete`);
    } catch (error) {
      console.error('[ProgressSync] Failed to mark lesson complete:', error);
    }
  }, [user?.id, options.onLessonComplete]);

  // Save quiz attempt to database
  const saveQuizAttempt = useCallback(async (
    quizId: string,
    score: number,
    passed: boolean,
    totalQuestions: number,
    correctAnswers: number,
    answers: Record<string, string[]>,
    startTime: Date,
    durationSeconds: number
  ) => {
    if (!user?.id) return;

    try {
      if (isSupabaseConfigured()) {
        await quizAttemptService.create({
          userId: user.id,
          quizId,
          enrollmentId: options.enrollmentId || '',
          score,
          passed,
          totalQuestions,
          correctAnswers,
          answers,
          startedAt: startTime,
          completedAt: new Date(),
          durationSeconds,
        });

        if (passed) {
          await gamificationService.incrementQuizzesPassed(user.id);
          await gamificationService.addXP(user.id, 50); // Award XP for passing quiz
        }
      } else {
        // localStorage fallback
        const key = `quiz_attempts_${user.id}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push({
          quizId,
          score,
          passed,
          totalQuestions,
          correctAnswers,
          completedAt: new Date().toISOString(),
        });
        localStorage.setItem(key, JSON.stringify(existing));
      }

      console.log(`[ProgressSync] Quiz attempt saved: ${score}% (${passed ? 'passed' : 'failed'})`);
    } catch (error) {
      console.error('[ProgressSync] Failed to save quiz attempt:', error);
    }
  }, [user?.id, options.enrollmentId]);

  // Update enrollment progress
  const updateEnrollmentProgress = useCallback(async (progressPercent: number) => {
    if (!user?.id || !options.enrollmentId || !isSupabaseConfigured()) return;

    try {
      const status = progressPercent >= 100 ? 'completed' : 'in_progress';
      await enrollmentService.updateProgress(options.enrollmentId, progressPercent, status);
      console.log(`[ProgressSync] Enrollment progress updated: ${progressPercent}%`);
    } catch (error) {
      console.error('[ProgressSync] Failed to update enrollment progress:', error);
    }
  }, [user?.id, options.enrollmentId]);

  // Load saved progress from database
  const loadProgress = useCallback(async () => {
    if (!user?.id) return null;

    try {
      if (isSupabaseConfigured()) {
        const [lessonProgress, quizAttempts, gamificationProfile] = await Promise.all([
          lessonProgressService.getByUser(user.id),
          quizAttemptService.getByUser(user.id),
          gamificationService.getOrCreate(user.id),
        ]);

        return {
          lessonProgress,
          quizAttempts,
          gamification: gamificationProfile,
        };
      } else {
        // Load from localStorage
        const lessonKeys = Object.keys(localStorage).filter(k => k.startsWith(`lesson_progress_${user.id}`));
        const lessonProgress = lessonKeys.map(k => JSON.parse(localStorage.getItem(k) || '{}'));
        const quizAttempts = JSON.parse(localStorage.getItem(`quiz_attempts_${user.id}`) || '[]');

        return {
          lessonProgress,
          quizAttempts,
          gamification: null,
        };
      }
    } catch (error) {
      console.error('[ProgressSync] Failed to load progress:', error);
      return null;
    }
  }, [user?.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured()) return;

    // Subscribe to lesson progress updates
    channelRef.current = lessonProgressService.subscribe(user.id, (payload) => {
      if (payload.eventType === 'UPDATE' && payload.new) {
        options.onProgressUpdate?.(payload.new.lesson_id, payload.new.progress_percent);
      }
    });

    return () => {
      if (channelRef.current) {
        lessonProgressService.unsubscribe(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, options.onProgressUpdate]);

  // Flush pending updates on unmount
  useEffect(() => {
    return () => {
      // Save any pending progress updates
      pendingUpdates.current.forEach((update, lessonId) => {
        saveVideoProgress(lessonId, update.progress, update.position, update.duration);
      });
    };
  }, [saveVideoProgress]);

  return {
    saveVideoProgress,
    markLessonComplete,
    saveQuizAttempt,
    updateEnrollmentProgress,
    loadProgress,
    isConnected: isSupabaseConfigured(),
  };
}

// Hook to track video playback progress
export function useVideoProgress(lessonId: string, enrollmentId?: string) {
  const { saveVideoProgress, markLessonComplete } = useProgressSync({ enrollmentId });
  const startTimeRef = useRef<Date | null>(null);

  const onPlay = useCallback(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = new Date();
    }
  }, []);

  const onProgress = useCallback((currentTime: number, duration: number) => {
    if (duration <= 0) return;

    const progress = Math.min((currentTime / duration) * 100, 100);
    const watchedSeconds = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
      : 0;

    saveVideoProgress(lessonId, progress, currentTime, watchedSeconds);
  }, [lessonId, saveVideoProgress]);

  const onComplete = useCallback(() => {
    markLessonComplete(lessonId);
  }, [lessonId, markLessonComplete]);

  const onEnded = useCallback((currentTime: number, duration: number) => {
    const watchedSeconds = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
      : Math.floor(duration);

    saveVideoProgress(lessonId, 100, duration, watchedSeconds);
    markLessonComplete(lessonId);
  }, [lessonId, saveVideoProgress, markLessonComplete]);

  return {
    onPlay,
    onProgress,
    onComplete,
    onEnded,
  };
}

export default useProgressSync;
