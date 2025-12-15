/**
 * GET /api/courses
 *
 * List available courses for the authenticated user
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
  category: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { supabase, error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { data: params, error: queryError } = parseQuery(request, querySchema);
  if (queryError) return queryError;

  // Build query
  let query = supabase
    .from('courses')
    .select('*', { count: 'exact' })
    .eq('status', 'published');

  // Apply filters
  if (params.category) {
    query = query.eq('category', params.category);
  }
  if (params.level) {
    query = query.eq('level', params.level);
  }
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,short_description.ilike.%${params.search}%`);
  }

  // Apply pagination
  query = applyPagination(query, params);

  const { data: courses, count, error } = await query;

  if (error) {
    return jsonResponse([], { total: 0, page: params.page, pageSize: params.pageSize, hasMore: false });
  }

  return jsonResponse(
    courses,
    createPaginationMeta(count ?? 0, params)
  );
}
