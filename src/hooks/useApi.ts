/**
 * API Hooks for fetching data from backend
 * Uses SWR for caching and revalidation
 */

import useSWR, { SWRConfiguration, mutate as globalMutate } from 'swr';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// Types
export interface Course {
  id: string;
  code: string;
  name: string;
  short_description?: string;
  full_description?: string;
  thumbnail_url?: string;
  category?: string;
  estimated_hours?: number;
  level?: string;
  total_lessons: number;
  total_modules: number;
}

export interface Module {
  id: string;
  course_id: string;
  number: number;
  title: string;
  description?: string;
  estimated_minutes?: number;
  sort_order: number;
  lessons: Lesson[];
  quizzes: Quiz[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'article' | 'interactive' | 'lab';
  video_url?: string;
  video_provider?: string;
  video_duration?: number;
  mux_playback_id?: string;
  article_content?: string;
  sort_order: number;
}

export interface Quiz {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  time_limit_minutes?: number;
  passing_score: number;
  max_attempts?: number;
  questions?: Question[];
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank';
  options: { id: string; text: string }[];
  correct_answers: string[];
  explanation?: string;
  points: number;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'expired';
  progress: number;
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
  scorm_lesson_location?: string;
  scorm_suspend_data?: Record<string, unknown>;
  scorm_total_time?: number;
  scorm_score?: number;
  scorm_completion_status?: string;
  scorm_success_status?: string;
  course?: Course;
  lesson_progress?: LessonProgress[];
  quiz_attempts?: QuizAttempt[];
}

export interface LessonProgress {
  id: string;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percent: number;
  last_position: number;
  watched_duration: number;
  started_at?: string;
  completed_at?: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  total_questions: number;
  correct_answers: number;
  attempt_number: number;
  completed_at?: string;
}

// Generic fetcher
const fetcher = async <T>(key: string): Promise<T> => {
  const response = await fetch(key);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  const result = await response.json();
  return result.data ?? result;
};

// SWR default options
const defaultOptions: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
};

/**
 * Hook to fetch user's enrollments
 */
export function useEnrollments(status?: string) {
  const { isAuthenticated } = useAuth();
  const params = new URLSearchParams();
  if (status) params.set('status', status);

  const key = isAuthenticated ? `/api/enrollments?${params.toString()}` : null;

  return useSWR<{ data: Enrollment[]; meta: { total: number } }>(
    key,
    fetcher,
    defaultOptions
  );
}

/**
 * Hook to fetch single enrollment with full details
 */
export function useEnrollment(enrollmentId: string | null) {
  const { isAuthenticated } = useAuth();
  const key = isAuthenticated && enrollmentId ? `/api/enrollments/${enrollmentId}` : null;

  return useSWR<Enrollment>(key, fetcher, defaultOptions);
}

/**
 * Hook to fetch available courses
 */
export function useCourses(filters?: { category?: string; level?: string }) {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.level) params.set('level', filters.level);

  return useSWR<{ data: Course[]; meta: { total: number } }>(
    `/api/courses?${params.toString()}`,
    fetcher,
    defaultOptions
  );
}

/**
 * Hook to fetch single course with modules and lessons
 */
export function useCourse(courseId: string | null) {
  const key = courseId ? `/api/courses/${courseId}` : null;
  return useSWR<Course & { modules: Module[] }>(key, fetcher, defaultOptions);
}

/**
 * Hook to update lesson progress
 */
export function useUpdateLessonProgress() {
  const updateProgress = async (data: {
    enrollmentId: string;
    lessonId: string;
    status?: 'not_started' | 'in_progress' | 'completed';
    progressPercent?: number;
    lastPosition?: number;
    watchedDuration?: number;
  }) => {
    const response = await fetch('/api/progress/lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Update failed' }));
      throw new Error(error.message || 'Update failed');
    }

    // Revalidate enrollment data
    globalMutate(`/api/enrollments/${data.enrollmentId}`);
    globalMutate('/api/enrollments');

    return response.json();
  };

  return { updateProgress };
}

/**
 * Hook to update SCORM data
 */
export function useUpdateSCORMData() {
  const updateSCORM = async (data: {
    enrollmentId: string;
    lessonLocation?: string;
    suspendData?: Record<string, unknown>;
    sessionTime?: number;
    score?: number;
    completionStatus?: 'incomplete' | 'completed';
    successStatus?: 'unknown' | 'passed' | 'failed';
    progressMeasure?: number;
  }) => {
    const response = await fetch('/api/progress/scorm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Update failed' }));
      throw new Error(error.message || 'Update failed');
    }

    // Revalidate enrollment data
    globalMutate(`/api/enrollments/${data.enrollmentId}`);

    return response.json();
  };

  const getSCORMData = async (enrollmentId: string) => {
    const response = await fetch(`/api/progress/scorm?enrollmentId=${enrollmentId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch SCORM data');
    }
    return response.json();
  };

  return { updateSCORM, getSCORMData };
}

/**
 * Hook to submit quiz
 */
export function useSubmitQuiz() {
  const submitQuiz = async (data: {
    enrollmentId: string;
    quizId: string;
    answers: Record<string, string[]>;
  }) => {
    const response = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Submission failed' }));
      throw new Error(error.message || 'Submission failed');
    }

    // Revalidate enrollment data
    globalMutate(`/api/enrollments/${data.enrollmentId}`);
    globalMutate('/api/enrollments');

    return response.json();
  };

  return { submitQuiz };
}

/**
 * Direct Supabase hooks for real-time data
 * Use these when you need real-time updates
 */
export function useRealtimeEnrollment(enrollmentId: string | null) {
  const { data, error, mutate } = useSWR(
    enrollmentId ? `realtime:enrollment:${enrollmentId}` : null,
    async () => {
      if (!isSupabaseConfigured() || !enrollmentId) return null;

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(*),
          lesson_progress(*),
          quiz_attempts(*)
        `)
        .eq('id', enrollmentId)
        .single();

      if (error) throw error;
      return data;
    },
    { ...defaultOptions, refreshInterval: 0 }
  );

  return { enrollment: data, error, refresh: () => mutate() };
}
