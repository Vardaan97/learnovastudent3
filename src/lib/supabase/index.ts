/**
 * Supabase Module Entry Point
 * ===========================
 *
 * Re-exports all Supabase-related functionality for easy imports.
 */

export { supabase, isSupabaseConfigured, subscribeToTable, unsubscribeFromChannel } from './client';
export type * from './types';
export {
  companyService,
  userService,
  courseService,
  enrollmentService,
  portalAccessService,
  setupGlobalSyncListener,
} from './services';
