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
