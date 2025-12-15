/**
 * GET /api/auth/me
 *
 * Get the current authenticated user's profile
 */

import { NextRequest } from 'next/server';
import { requireAuth, jsonResponse } from '@/lib/api/utils';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  return jsonResponse(user);
}
