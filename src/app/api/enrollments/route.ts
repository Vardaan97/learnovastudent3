/**
 * GET /api/enrollments
 *
 * Get the current user's course enrollments with progress
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  requireAuth,
  parseQuery,
  jsonResponse,
  paginationSchema,
  applyPagination,
  createPaginationMeta,
} from '@/lib/api/utils';

const querySchema = paginationSchema.extend({
  status: z.enum(['not_started', 'in_progress', 'completed', 'expired']).optional(),
});

export async function GET(request: NextRequest) {
  const { user, supabase, error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { data: params, error: queryError } = parseQuery(request, querySchema);
  if (queryError) return queryError;

  // Build query
  let query = supabase
    .from('enrollments')
    .select(`
      id,
      status,
      progress,
      enrolled_at,
      started_at,
      completed_at,
      expires_at,
      scorm_total_time,
      scorm_score,
      scorm_completion_status,
      scorm_success_status,
      course:courses (
        id,
        code,
        name,
        short_description,
        thumbnail_url,
        category,
        estimated_hours,
        level,
        total_lessons,
        total_modules
      )
    `, { count: 'exact' })
    .eq('user_id', user.id);

  // Apply status filter
  if (params.status) {
    query = query.eq('status', params.status);
  }

  // Apply pagination
  query = applyPagination(query, params);

  const { data: enrollments, count, error } = await query;

  if (error) {
    return jsonResponse([], { total: 0, page: params.page, pageSize: params.pageSize, hasMore: false });
  }

  return jsonResponse(
    enrollments,
    createPaginationMeta(count ?? 0, params)
  );
}
