/**
 * POST /api/auth/login
 *
 * Sign in with email and password using Supabase Auth
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createApiClient,
  parseBody,
  jsonResponse,
  errorResponse,
} from '@/lib/api/utils';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  // Parse and validate request body
  const { data: body, error: validationError } = await parseBody(request, loginSchema);
  if (validationError) return validationError;

  const { supabase } = createApiClient(request);

  // Sign in with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error) {
    return errorResponse(error.message, 401, 'AUTH_ERROR');
  }

  if (!data.user || !data.session) {
    return errorResponse('Login failed', 401, 'AUTH_ERROR');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role, company_id, avatar_url')
    .eq('id', data.user.id)
    .single();

  // Check role authorization for learner portal
  const allowedRoles = ['learner', 'team_lead', 'manager', 'company_admin'];
  if (profile && !allowedRoles.includes(profile.role)) {
    await supabase.auth.signOut();
    return errorResponse('You do not have access to the Learner Portal', 403, 'PORTAL_ACCESS_DENIED');
  }

  // Update last login
  if (profile) {
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id);
  }

  return jsonResponse({
    user: profile,
    session: {
      accessToken: data.session.access_token,
      expiresAt: data.session.expires_at,
    },
  });
}
