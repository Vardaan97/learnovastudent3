/**
 * POST /api/auth/logout
 *
 * Sign out the current user
 */

import { NextRequest } from 'next/server';
import { createApiClient, jsonResponse, errorResponse } from '@/lib/api/utils';

export async function POST(request: NextRequest) {
  const { supabase } = createApiClient(request);

  const { error } = await supabase.auth.signOut();

  if (error) {
    return errorResponse(error.message, 500, 'SIGNOUT_ERROR');
  }

  return jsonResponse({ success: true });
}
