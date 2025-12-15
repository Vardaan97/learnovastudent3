/**
 * API Route Utilities
 *
 * Shared utilities for API route handlers including:
 * - Response helpers
 * - Error handling
 * - Request validation
 * - Supabase client creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z, ZodError, ZodSchema } from 'zod';

// =============================================================================
// TYPES
// =============================================================================

export interface APIResponse<T = unknown> {
  data: T | null;
  error: string | null;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
  };
}

export interface APIErrorResponse {
  data: null;
  error: string;
  code?: string;
  details?: unknown;
}

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

/**
 * Create a Supabase client for API routes
 */
export function createApiClient(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return { supabase, response };
}

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

/**
 * Return a successful JSON response
 */
export function jsonResponse<T>(
  data: T,
  meta?: APIResponse['meta'],
  status: number = 200
): NextResponse<APIResponse<T>> {
  return NextResponse.json(
    { data, error: null, meta },
    { status }
  );
}

/**
 * Return an error JSON response
 */
export function errorResponse(
  error: string,
  status: number = 400,
  code?: string,
  details?: unknown
): NextResponse<APIErrorResponse> {
  return NextResponse.json(
    { data: null, error, code, details },
    { status }
  );
}

/**
 * Return a 401 Unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse<APIErrorResponse> {
  return errorResponse(message, 401, 'UNAUTHORIZED');
}

/**
 * Return a 403 Forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse<APIErrorResponse> {
  return errorResponse(message, 403, 'FORBIDDEN');
}

/**
 * Return a 404 Not Found response
 */
export function notFoundResponse(message: string = 'Not found'): NextResponse<APIErrorResponse> {
  return errorResponse(message, 404, 'NOT_FOUND');
}

/**
 * Return a 500 Internal Server Error response
 */
export function serverErrorResponse(message: string = 'Internal server error'): NextResponse<APIErrorResponse> {
  return errorResponse(message, 500, 'SERVER_ERROR');
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Parse and validate request body with Zod schema
 */
export async function parseBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse<APIErrorResponse> }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        data: null,
        error: errorResponse(
          'Validation error',
          400,
          'VALIDATION_ERROR',
          err.issues.map((e) => ({ path: e.path.join('.'), message: e.message }))
        ),
      };
    }
    if (err instanceof SyntaxError) {
      return {
        data: null,
        error: errorResponse('Invalid JSON body', 400, 'INVALID_JSON'),
      };
    }
    throw err;
  }
}

/**
 * Parse and validate query parameters with Zod schema
 */
export function parseQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse<APIErrorResponse> } {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const data = schema.parse(params);
    return { data, error: null };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        data: null,
        error: errorResponse(
          'Invalid query parameters',
          400,
          'VALIDATION_ERROR',
          err.issues.map((e) => ({ path: e.path.join('.'), message: e.message }))
        ),
      };
    }
    throw err;
  }
}

// =============================================================================
// AUTH HELPERS
// =============================================================================

/**
 * Get authenticated user from request
 */
export async function getAuthUser(request: NextRequest) {
  const { supabase } = createApiClient(request);

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return { user: null, session: null, error: unauthorizedResponse() };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role, company_id, status, is_active')
    .eq('id', session.user.id)
    .single();

  if (!profile || !profile.is_active || profile.status !== 'active') {
    return { user: null, session: null, error: unauthorizedResponse('Account disabled') };
  }

  return { user: profile, session, error: null };
}

/**
 * Require authentication - returns error response if not authenticated
 */
export async function requireAuth(request: NextRequest) {
  const { user, session, error } = await getAuthUser(request);
  if (error) {
    return { user: null, session: null, supabase: null, error };
  }
  const { supabase } = createApiClient(request);
  return { user: user!, session: session!, supabase, error: null };
}

/**
 * Require specific roles
 */
export async function requireRole(request: NextRequest, allowedRoles: string[]) {
  const result = await requireAuth(request);
  if (result.error) return result;

  if (!allowedRoles.includes(result.user!.role)) {
    return { ...result, error: forbiddenResponse('Insufficient permissions') };
  }

  return result;
}

// =============================================================================
// PAGINATION HELPERS
// =============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Apply pagination to a Supabase query
 */
export function applyPagination(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  params: PaginationParams
) {
  const { page, pageSize, sortBy, sortOrder } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let paginatedQuery = query.range(from, to);

  if (sortBy) {
    paginatedQuery = paginatedQuery.order(sortBy, { ascending: sortOrder === 'asc' });
  }

  return paginatedQuery;
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  total: number,
  params: PaginationParams
): APIResponse['meta'] {
  const { page, pageSize } = params;
  const totalPages = Math.ceil(total / pageSize);

  return {
    total,
    page,
    pageSize,
    hasMore: page < totalPages,
  };
}
