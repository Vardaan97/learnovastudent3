/**
 * Supabase Client Configuration
 * ==============================
 *
 * Shared Supabase client for all Koenig Learning Portal apps.
 * This file should be identical across all three apps:
 * - koenig-sales-portal
 * - koenig-learner-portal
 * - koenig-lms (TC Dashboard)
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Copy your project URL and anon key
 * 3. Add to .env.local:
 *    NEXT_PUBLIC_SUPABASE_URL=your-project-url
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    '⚠️ Supabase credentials not configured. Running in demo mode with localStorage fallback.\n' +
    'To enable real-time sync, add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
  );
}

// Create Supabase client with real-time enabled
// Using generic type for flexibility across different table schemas
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));
};

// Real-time subscription helpers
export const subscribeToTable = <T>(
  table: string,
  callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: T; old: T }) => void,
  filter?: { column: string; value: string }
): RealtimeChannel => {
  let channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        ...(filter && { filter: `${filter.column}=eq.${filter.value}` }),
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as T,
          old: payload.old as T,
        });
      }
    )
    .subscribe();

  return channel;
};

// Unsubscribe helper
export const unsubscribeFromChannel = (channel: RealtimeChannel) => {
  supabase.removeChannel(channel);
};

export default supabase;
