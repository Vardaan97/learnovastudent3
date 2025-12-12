/**
 * Database Services Layer
 * =======================
 *
 * Centralized data access layer with Supabase backend and localStorage fallback.
 * Provides real-time sync across all three portals.
 */

import { supabase, isSupabaseConfigured } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Storage keys for localStorage fallback
const STORAGE_KEYS = {
  COMPANIES: 'koenig_companies',
  USERS: 'koenig_users',
  COURSES: 'koenig_courses',
  ENROLLMENTS: 'koenig_enrollments',
  PORTAL_ACCESS: 'koenig_portal_access',
  SYNC_TIMESTAMP: 'koenig_sync_timestamp',
} as const;

// Helper to broadcast changes across tabs
const broadcastChange = (key: string, data: unknown) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.SYNC_TIMESTAMP, Date.now().toString());
    window.dispatchEvent(new CustomEvent('koenig-data-change', { detail: { key, data } }));
  }
};

// Helper to get from localStorage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Generic types for service operations
/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyRecord = Record<string, any>;

// ============================================================================
// COMPANY SERVICES
// ============================================================================

export const companyService = {
  // Get all companies
  async getAll(): Promise<AnyRecord[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
    return getFromStorage<AnyRecord[]>(STORAGE_KEYS.COMPANIES, []);
  },

  // Get company by ID
  async getById(id: string): Promise<AnyRecord | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    const companies = getFromStorage<AnyRecord[]>(STORAGE_KEYS.COMPANIES, []);
    return companies.find(c => c.id === id) || null;
  },

  // Get company by slug
  async getBySlug(slug: string): Promise<AnyRecord | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    const companies = getFromStorage<AnyRecord[]>(STORAGE_KEYS.COMPANIES, []);
    return companies.find(c => c.slug === slug) || null;
  },

  // Create company
  async create(company: AnyRecord): Promise<AnyRecord> {
    const newCompany = {
      ...company,
      id: company.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('companies')
        .insert(newCompany as any)
        .select()
        .single();
      if (error) throw error;
      return data as AnyRecord;
    }

    const companies = getFromStorage<AnyRecord[]>(STORAGE_KEYS.COMPANIES, []);
    companies.push(newCompany);
    broadcastChange(STORAGE_KEYS.COMPANIES, companies);
    return newCompany;
  },

  // Update company
  async update(id: string, updates: AnyRecord): Promise<AnyRecord> {
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('companies')
        .update(updatedData as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AnyRecord;
    }

    const companies = getFromStorage<AnyRecord[]>(STORAGE_KEYS.COMPANIES, []);
    const index = companies.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Company not found');
    companies[index] = { ...companies[index], ...updatedData };
    broadcastChange(STORAGE_KEYS.COMPANIES, companies);
    return companies[index];
  },

  // Delete company
  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return;
    }

    const companies = getFromStorage<AnyRecord[]>(STORAGE_KEYS.COMPANIES, []);
    const filtered = companies.filter(c => c.id !== id);
    broadcastChange(STORAGE_KEYS.COMPANIES, filtered);
  },

  // Subscribe to real-time updates
  subscribe(callback: (payload: { eventType: string; new: AnyRecord; old: AnyRecord }) => void): RealtimeChannel | null {
    if (isSupabaseConfigured()) {
      return supabase
        .channel('companies-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'companies' },
          (payload) => {
            callback({
              eventType: payload.eventType,
              new: payload.new as AnyRecord,
              old: payload.old as AnyRecord,
            });
          }
        )
        .subscribe();
    }
    return null;
  },

  // Unsubscribe
  unsubscribe(channel: RealtimeChannel | null) {
    if (channel) supabase.removeChannel(channel);
  },
};

// ============================================================================
// USER SERVICES
// ============================================================================

export const userService = {
  // Get all users for a company
  async getByCompany(companyId: string): Promise<AnyRecord[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const users = getFromStorage<AnyRecord[]>(STORAGE_KEYS.USERS, []);
    return users.filter(u => u.company_id === companyId);
  },

  // Get user by email
  async getByEmail(email: string): Promise<AnyRecord | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    const users = getFromStorage<AnyRecord[]>(STORAGE_KEYS.USERS, []);
    return users.find(u => u.email === email) || null;
  },

  // Get user by ID
  async getById(id: string): Promise<AnyRecord | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    const users = getFromStorage<AnyRecord[]>(STORAGE_KEYS.USERS, []);
    return users.find(u => u.id === id) || null;
  },

  // Create user
  async create(user: AnyRecord): Promise<AnyRecord> {
    const newUser = {
      ...user,
      id: user.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('users')
        .insert(newUser as any)
        .select()
        .single();
      if (error) throw error;
      return data as AnyRecord;
    }

    const users = getFromStorage<AnyRecord[]>(STORAGE_KEYS.USERS, []);
    users.push(newUser);
    broadcastChange(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  // Update user
  async update(id: string, updates: AnyRecord): Promise<AnyRecord> {
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('users')
        .update(updatedData as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AnyRecord;
    }

    const users = getFromStorage<AnyRecord[]>(STORAGE_KEYS.USERS, []);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    users[index] = { ...users[index], ...updatedData };
    broadcastChange(STORAGE_KEYS.USERS, users);
    return users[index];
  },

  // Authenticate user
  async authenticate(email: string, _password: string): Promise<AnyRecord | null> {
    // In production, this would verify password hash
    // For demo, just find the user
    const user = await userService.getByEmail(email);
    if (user) {
      await userService.update(user.id, { last_login_at: new Date().toISOString() });
    }
    return user;
  },

  // Subscribe to real-time updates
  subscribe(companyId: string, callback: (payload: { eventType: string; new: AnyRecord; old: AnyRecord }) => void): RealtimeChannel | null {
    if (isSupabaseConfigured()) {
      return supabase
        .channel(`users-${companyId}-changes`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users', filter: `company_id=eq.${companyId}` },
          (payload) => {
            callback({
              eventType: payload.eventType,
              new: payload.new as AnyRecord,
              old: payload.old as AnyRecord,
            });
          }
        )
        .subscribe();
    }
    return null;
  },

  unsubscribe(channel: RealtimeChannel | null) {
    if (channel) supabase.removeChannel(channel);
  },
};

// ============================================================================
// COURSE SERVICES
// ============================================================================

export const courseService = {
  // Get all courses
  async getAll(): Promise<AnyRecord[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('name');
      if (error) throw error;
      return data || [];
    }
    return getFromStorage<AnyRecord[]>(STORAGE_KEYS.COURSES, []);
  },

  // Get course by ID
  async getById(id: string): Promise<AnyRecord | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    const courses = getFromStorage<AnyRecord[]>(STORAGE_KEYS.COURSES, []);
    return courses.find(c => c.id === id) || null;
  },

  // Get course by code
  async getByCode(code: string): Promise<AnyRecord | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('code', code)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    const courses = getFromStorage<AnyRecord[]>(STORAGE_KEYS.COURSES, []);
    return courses.find(c => c.code === code) || null;
  },

  // Create course
  async create(course: AnyRecord): Promise<AnyRecord> {
    const newCourse = {
      ...course,
      id: course.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('courses')
        .insert(newCourse as any)
        .select()
        .single();
      if (error) throw error;
      return data as AnyRecord;
    }

    const courses = getFromStorage<AnyRecord[]>(STORAGE_KEYS.COURSES, []);
    courses.push(newCourse);
    broadcastChange(STORAGE_KEYS.COURSES, courses);
    return newCourse;
  },

  // Update course
  async update(id: string, updates: AnyRecord): Promise<AnyRecord> {
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('courses')
        .update(updatedData as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AnyRecord;
    }

    const courses = getFromStorage<AnyRecord[]>(STORAGE_KEYS.COURSES, []);
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Course not found');
    courses[index] = { ...courses[index], ...updatedData };
    broadcastChange(STORAGE_KEYS.COURSES, courses);
    return courses[index];
  },
};

// ============================================================================
// ENROLLMENT SERVICES
// ============================================================================

export const enrollmentService = {
  // Get enrollments for a user
  async getByUser(userId: string): Promise<AnyRecord[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data || [];
    }
    const enrollments = getFromStorage<AnyRecord[]>(STORAGE_KEYS.ENROLLMENTS, []);
    return enrollments.filter(e => e.user_id === userId);
  },

  // Get enrollments for a company
  async getByCompany(companyId: string): Promise<AnyRecord[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('company_id', companyId);
      if (error) throw error;
      return data || [];
    }
    const enrollments = getFromStorage<AnyRecord[]>(STORAGE_KEYS.ENROLLMENTS, []);
    return enrollments.filter(e => e.company_id === companyId);
  },

  // Create enrollment
  async create(enrollment: AnyRecord): Promise<AnyRecord> {
    const newEnrollment = {
      ...enrollment,
      id: enrollment.id || crypto.randomUUID(),
      enrolled_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('enrollments')
        .insert(newEnrollment as any)
        .select()
        .single();
      if (error) throw error;
      return data as AnyRecord;
    }

    const enrollments = getFromStorage<AnyRecord[]>(STORAGE_KEYS.ENROLLMENTS, []);
    enrollments.push(newEnrollment);
    broadcastChange(STORAGE_KEYS.ENROLLMENTS, enrollments);
    return newEnrollment;
  },

  // Update enrollment progress
  async updateProgress(id: string, progress: number, status?: 'in_progress' | 'completed'): Promise<AnyRecord> {
    const updates: AnyRecord = { progress };
    if (status) updates.status = status;
    if (progress > 0 && !status) updates.status = 'in_progress';
    if (progress === 100) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('enrollments')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AnyRecord;
    }

    const enrollments = getFromStorage<AnyRecord[]>(STORAGE_KEYS.ENROLLMENTS, []);
    const index = enrollments.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Enrollment not found');
    enrollments[index] = { ...enrollments[index], ...updates };
    broadcastChange(STORAGE_KEYS.ENROLLMENTS, enrollments);
    return enrollments[index];
  },

  // Subscribe to real-time updates
  subscribe(companyId: string, callback: (payload: { eventType: string; new: AnyRecord; old: AnyRecord }) => void): RealtimeChannel | null {
    if (isSupabaseConfigured()) {
      return supabase
        .channel(`enrollments-${companyId}-changes`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'enrollments', filter: `company_id=eq.${companyId}` },
          (payload) => {
            callback({
              eventType: payload.eventType,
              new: payload.new as AnyRecord,
              old: payload.old as AnyRecord,
            });
          }
        )
        .subscribe();
    }
    return null;
  },

  unsubscribe(channel: RealtimeChannel | null) {
    if (channel) supabase.removeChannel(channel);
  },
};

// ============================================================================
// PORTAL ACCESS SERVICES
// ============================================================================

export const portalAccessService = {
  // Get all access records for a company
  async getByCompany(companyId: string): Promise<AnyRecord[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('portal_access')
        .select('*')
        .eq('company_id', companyId);
      if (error) throw error;
      return data || [];
    }
    const access = getFromStorage<AnyRecord[]>(STORAGE_KEYS.PORTAL_ACCESS, []);
    return access.filter(a => a.company_id === companyId);
  },

  // Create portal access credentials
  async create(access: AnyRecord): Promise<AnyRecord> {
    const newAccess = {
      ...access,
      id: access.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('portal_access')
        .insert(newAccess as any)
        .select()
        .single();
      if (error) throw error;
      return data as AnyRecord;
    }

    const allAccess = getFromStorage<AnyRecord[]>(STORAGE_KEYS.PORTAL_ACCESS, []);
    allAccess.push(newAccess);
    broadcastChange(STORAGE_KEYS.PORTAL_ACCESS, allAccess);
    return newAccess;
  },

  // Update access (e.g., mark password as changed)
  async update(id: string, updates: AnyRecord): Promise<AnyRecord> {
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('portal_access')
        .update(updatedData as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AnyRecord;
    }

    const allAccess = getFromStorage<AnyRecord[]>(STORAGE_KEYS.PORTAL_ACCESS, []);
    const index = allAccess.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Portal access not found');
    allAccess[index] = { ...allAccess[index], ...updatedData };
    broadcastChange(STORAGE_KEYS.PORTAL_ACCESS, allAccess);
    return allAccess[index];
  },

  // Validate access credentials
  async validateAccess(url: string, email: string, password: string): Promise<{ valid: boolean; user?: AnyRecord; company?: AnyRecord }> {
    // Find access record matching the URL pattern
    let allAccess: AnyRecord[];
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('portal_access').select('*').eq('access_url', url);
      allAccess = data || [];
    } else {
      allAccess = getFromStorage<AnyRecord[]>(STORAGE_KEYS.PORTAL_ACCESS, []);
    }

    const accessRecord = allAccess.find(a => a.access_url === url);
    if (!accessRecord) return { valid: false };

    // Verify password
    if (accessRecord.temp_password !== password) return { valid: false };

    // Get user and company
    const user = await userService.getById(accessRecord.user_id);
    const company = await companyService.getById(accessRecord.company_id);

    return { valid: true, user: user || undefined, company: company || undefined };
  },
};

// ============================================================================
// LESSON PROGRESS SERVICES
// ============================================================================

const LESSON_PROGRESS_KEY = 'koenig_lesson_progress';
const QUIZ_ATTEMPTS_KEY = 'koenig_quiz_attempts';
const GAMIFICATION_KEY = 'koenig_gamification';

export const lessonProgressService = {
  // Get all lesson progress for an enrollment
  async getByEnrollment(enrollmentId: string): Promise<AnyRecord[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollmentId);
      if (error) throw error;
      return data || [];
    }
    const progress = getFromStorage<AnyRecord[]>(LESSON_PROGRESS_KEY, []);
    return progress.filter(p => p.enrollment_id === enrollmentId);
  },

  // Get lesson progress for a specific user
  async getByUser(userId: string): Promise<AnyRecord[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .order('last_accessed_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const progress = getFromStorage<AnyRecord[]>(LESSON_PROGRESS_KEY, []);
    return progress.filter(p => p.user_id === userId);
  },

  // Get or create lesson progress
  async getOrCreate(userId: string, lessonId: string, enrollmentId: string): Promise<AnyRecord> {
    if (isSupabaseConfigured()) {
      // Try to find existing
      const { data: existing } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single();

      if (existing) return existing;

      // Create new
      const newProgress = {
        id: crypto.randomUUID(),
        user_id: userId,
        lesson_id: lessonId,
        enrollment_id: enrollmentId,
        status: 'not_started',
        progress_percent: 0,
        last_position: 0,
        watched_duration: 0,
        last_accessed_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('lesson_progress')
        .insert(newProgress)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    // localStorage fallback
    const allProgress = getFromStorage<AnyRecord[]>(LESSON_PROGRESS_KEY, []);
    const existing = allProgress.find(p => p.user_id === userId && p.lesson_id === lessonId);
    if (existing) return existing;

    const newProgress = {
      id: crypto.randomUUID(),
      user_id: userId,
      lesson_id: lessonId,
      enrollment_id: enrollmentId,
      status: 'not_started',
      progress_percent: 0,
      last_position: 0,
      watched_duration: 0,
      last_accessed_at: new Date().toISOString(),
    };
    allProgress.push(newProgress);
    broadcastChange(LESSON_PROGRESS_KEY, allProgress);
    return newProgress;
  },

  // Update lesson progress
  async updateProgress(
    userId: string,
    lessonId: string,
    progressPercent: number,
    lastPosition: number,
    watchedDuration?: number
  ): Promise<AnyRecord> {
    const updates: AnyRecord = {
      progress_percent: Math.round(progressPercent),
      last_position: Math.round(lastPosition),
      last_accessed_at: new Date().toISOString(),
    };

    if (watchedDuration !== undefined) {
      updates.watched_duration = Math.round(watchedDuration);
    }

    if (progressPercent > 0) {
      updates.status = 'in_progress';
      if (!updates.started_at) {
        updates.started_at = new Date().toISOString();
      }
    }

    if (progressPercent >= 100) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
      updates.progress_percent = 100;
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('lesson_progress')
        .update(updates)
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const allProgress = getFromStorage<AnyRecord[]>(LESSON_PROGRESS_KEY, []);
    const index = allProgress.findIndex(p => p.user_id === userId && p.lesson_id === lessonId);
    if (index !== -1) {
      allProgress[index] = { ...allProgress[index], ...updates };
      broadcastChange(LESSON_PROGRESS_KEY, allProgress);
      return allProgress[index];
    }
    throw new Error('Lesson progress not found');
  },

  // Mark lesson as completed
  async markCompleted(userId: string, lessonId: string): Promise<AnyRecord> {
    return this.updateProgress(userId, lessonId, 100, 0);
  },

  // Subscribe to real-time updates for a user's progress
  subscribe(userId: string, callback: (payload: { eventType: string; new: AnyRecord; old: AnyRecord }) => void): RealtimeChannel | null {
    if (isSupabaseConfigured()) {
      return supabase
        .channel(`lesson-progress-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'lesson_progress', filter: `user_id=eq.${userId}` },
          (payload) => {
            callback({
              eventType: payload.eventType,
              new: payload.new as AnyRecord,
              old: payload.old as AnyRecord,
            });
          }
        )
        .subscribe();
    }
    return null;
  },

  unsubscribe(channel: RealtimeChannel | null) {
    if (channel) supabase.removeChannel(channel);
  },
};

// ============================================================================
// QUIZ ATTEMPT SERVICES
// ============================================================================

export const quizAttemptService = {
  // Get attempts for a user
  async getByUser(userId: string): Promise<AnyRecord[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const attempts = getFromStorage<AnyRecord[]>(QUIZ_ATTEMPTS_KEY, []);
    return attempts.filter(a => a.user_id === userId);
  },

  // Get attempts for a specific quiz
  async getByQuiz(userId: string, quizId: string): Promise<AnyRecord[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('quiz_id', quizId)
        .order('attempt_number', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const attempts = getFromStorage<AnyRecord[]>(QUIZ_ATTEMPTS_KEY, []);
    return attempts.filter(a => a.user_id === userId && a.quiz_id === quizId);
  },

  // Record a quiz attempt
  async create(attempt: {
    userId: string;
    quizId: string;
    enrollmentId: string;
    score: number;
    passed: boolean;
    totalQuestions: number;
    correctAnswers: number;
    answers: Record<string, string[]>;
    startedAt: Date;
    completedAt: Date;
    durationSeconds: number;
  }): Promise<AnyRecord> {
    // Get attempt count for this quiz
    const previousAttempts = await this.getByQuiz(attempt.userId, attempt.quizId);
    const attemptNumber = previousAttempts.length + 1;

    const newAttempt = {
      id: crypto.randomUUID(),
      user_id: attempt.userId,
      quiz_id: attempt.quizId,
      enrollment_id: attempt.enrollmentId,
      score: attempt.score,
      passed: attempt.passed,
      total_questions: attempt.totalQuestions,
      correct_answers: attempt.correctAnswers,
      answers: attempt.answers,
      started_at: attempt.startedAt.toISOString(),
      completed_at: attempt.completedAt.toISOString(),
      duration_seconds: attempt.durationSeconds,
      attempt_number: attemptNumber,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert(newAttempt)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const allAttempts = getFromStorage<AnyRecord[]>(QUIZ_ATTEMPTS_KEY, []);
    allAttempts.push(newAttempt);
    broadcastChange(QUIZ_ATTEMPTS_KEY, allAttempts);
    return newAttempt;
  },

  // Subscribe to real-time updates
  subscribe(userId: string, callback: (payload: { eventType: string; new: AnyRecord; old: AnyRecord }) => void): RealtimeChannel | null {
    if (isSupabaseConfigured()) {
      return supabase
        .channel(`quiz-attempts-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'quiz_attempts', filter: `user_id=eq.${userId}` },
          (payload) => {
            callback({
              eventType: payload.eventType,
              new: payload.new as AnyRecord,
              old: payload.old as AnyRecord,
            });
          }
        )
        .subscribe();
    }
    return null;
  },

  unsubscribe(channel: RealtimeChannel | null) {
    if (channel) supabase.removeChannel(channel);
  },
};

// ============================================================================
// GAMIFICATION PROFILE SERVICES
// ============================================================================

export const gamificationService = {
  // Get gamification profile for a user
  async getByUser(userId: string): Promise<AnyRecord | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('gamification_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    const profiles = getFromStorage<AnyRecord[]>(GAMIFICATION_KEY, []);
    return profiles.find(p => p.user_id === userId) || null;
  },

  // Get or create gamification profile
  async getOrCreate(userId: string): Promise<AnyRecord> {
    const existing = await this.getByUser(userId);
    if (existing) return existing;

    const newProfile = {
      id: crypto.randomUUID(),
      user_id: userId,
      total_xp: 0,
      current_level: 1,
      xp_to_next_level: 100,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      total_study_minutes: 0,
      total_lessons_completed: 0,
      total_quizzes_passed: 0,
      total_achievements: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('gamification_profiles')
        .insert(newProfile)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const profiles = getFromStorage<AnyRecord[]>(GAMIFICATION_KEY, []);
    profiles.push(newProfile);
    broadcastChange(GAMIFICATION_KEY, profiles);
    return newProfile;
  },

  // Add XP and update level
  async addXP(userId: string, xp: number): Promise<AnyRecord> {
    const profile = await this.getOrCreate(userId);
    let newXP = (profile.total_xp || 0) + xp;
    let level = profile.current_level || 1;
    let xpToNext = profile.xp_to_next_level || 100;

    // Level up logic
    while (newXP >= xpToNext) {
      newXP -= xpToNext;
      level++;
      xpToNext = Math.floor(xpToNext * 1.5); // 50% more XP needed each level
    }

    const updates = {
      total_xp: (profile.total_xp || 0) + xp,
      current_level: level,
      xp_to_next_level: xpToNext,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('gamification_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const profiles = getFromStorage<AnyRecord[]>(GAMIFICATION_KEY, []);
    const index = profiles.findIndex(p => p.user_id === userId);
    if (index !== -1) {
      profiles[index] = { ...profiles[index], ...updates };
      broadcastChange(GAMIFICATION_KEY, profiles);
      return profiles[index];
    }
    throw new Error('Profile not found');
  },

  // Update streak
  async updateStreak(userId: string): Promise<AnyRecord> {
    const profile = await this.getOrCreate(userId);
    const today = new Date().toISOString().split('T')[0];
    const lastDate = profile.last_activity_date;

    let newStreak = profile.current_streak || 0;
    let longestStreak = profile.longest_streak || 0;

    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === yesterdayStr) {
        newStreak++;
      } else {
        newStreak = 1;
      }

      if (newStreak > longestStreak) {
        longestStreak = newStreak;
      }
    }

    const updates = {
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('gamification_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const profiles = getFromStorage<AnyRecord[]>(GAMIFICATION_KEY, []);
    const index = profiles.findIndex(p => p.user_id === userId);
    if (index !== -1) {
      profiles[index] = { ...profiles[index], ...updates };
      broadcastChange(GAMIFICATION_KEY, profiles);
      return profiles[index];
    }
    throw new Error('Profile not found');
  },

  // Increment lessons completed
  async incrementLessonsCompleted(userId: string): Promise<AnyRecord> {
    const profile = await this.getOrCreate(userId);
    const updates = {
      total_lessons_completed: (profile.total_lessons_completed || 0) + 1,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('gamification_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const profiles = getFromStorage<AnyRecord[]>(GAMIFICATION_KEY, []);
    const index = profiles.findIndex(p => p.user_id === userId);
    if (index !== -1) {
      profiles[index] = { ...profiles[index], ...updates };
      broadcastChange(GAMIFICATION_KEY, profiles);
      return profiles[index];
    }
    throw new Error('Profile not found');
  },

  // Increment quizzes passed
  async incrementQuizzesPassed(userId: string): Promise<AnyRecord> {
    const profile = await this.getOrCreate(userId);
    const updates = {
      total_quizzes_passed: (profile.total_quizzes_passed || 0) + 1,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('gamification_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const profiles = getFromStorage<AnyRecord[]>(GAMIFICATION_KEY, []);
    const index = profiles.findIndex(p => p.user_id === userId);
    if (index !== -1) {
      profiles[index] = { ...profiles[index], ...updates };
      broadcastChange(GAMIFICATION_KEY, profiles);
      return profiles[index];
    }
    throw new Error('Profile not found');
  },

  // Subscribe to real-time updates
  subscribe(userId: string, callback: (payload: { eventType: string; new: AnyRecord; old: AnyRecord }) => void): RealtimeChannel | null {
    if (isSupabaseConfigured()) {
      return supabase
        .channel(`gamification-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'gamification_profiles', filter: `user_id=eq.${userId}` },
          (payload) => {
            callback({
              eventType: payload.eventType,
              new: payload.new as AnyRecord,
              old: payload.old as AnyRecord,
            });
          }
        )
        .subscribe();
    }
    return null;
  },

  unsubscribe(channel: RealtimeChannel | null) {
    if (channel) supabase.removeChannel(channel);
  },
};

// ============================================================================
// GLOBAL SYNC LISTENER
// ============================================================================

export const setupGlobalSyncListener = (callback: (key: string, data: unknown) => void) => {
  if (typeof window === 'undefined') return () => {};

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key && Object.values(STORAGE_KEYS).includes(event.key as typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS])) {
      try {
        const data = event.newValue ? JSON.parse(event.newValue) : null;
        callback(event.key, data);
      } catch {
        // Ignore parse errors
      }
    }
  };

  const handleCustomEvent = (event: CustomEvent<{ key: string; data: unknown }>) => {
    callback(event.detail.key, event.detail.data);
  };

  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('koenig-data-change', handleCustomEvent as EventListener);

  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('koenig-data-change', handleCustomEvent as EventListener);
  };
};
