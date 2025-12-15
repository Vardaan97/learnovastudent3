/**
 * Next.js Middleware for Koenig Learner Portal
 *
 * Handles authentication and authorization using Supabase Auth.
 * Protected routes require valid session and learner role.
 *
 * IMPORTANT: This middleware is DISABLED when:
 * 1. Supabase credentials are not configured (demo mode)
 * 2. The app is running in demo/development mode
 *
 * Client-side auth (AuthContext) handles demo mode via localStorage.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Check if Supabase is properly configured
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const IS_SUPABASE_CONFIGURED = !!(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL !== 'your-project-url' &&
  !SUPABASE_URL.includes('example') &&
  SUPABASE_URL.includes('.supabase.co')
);

// Portal configuration
const LOGIN_PATH = '/login';
const HOME_PATH = '/';

// Allowed roles for this portal
const ALLOWED_ROLES = ['learner', 'team_lead', 'manager', 'company_admin'];

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/reset-password',
  '/verify-email',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
  '/icons',
  '/offline.html',
];

// Auth paths that should redirect to home if authenticated
const AUTH_PATHS = ['/login', '/signup'];

/**
 * Check if path is public
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => {
    if (path.endsWith('*')) {
      return pathname.startsWith(path.slice(0, -1));
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

/**
 * Check if path is an auth path
 */
function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Check if path matches a company slug pattern (e.g., /pwc, /rt, /accenture)
 * These are dynamic routes that should be allowed through for client-side auth
 */
function isCompanySlugPath(pathname: string): boolean {
  // Match paths like /pwc, /rt, /accenture but not /login, /signup, etc.
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return false;

  const firstPart = parts[0];
  // If it's not a known route, assume it's a company slug
  const knownRoutes = ['login', 'signup', 'api', '_next', 'dashboard', 'courses', 'profile', 'settings'];
  return !knownRoutes.includes(firstPart);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Add security headers to all responses
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // If Supabase is not configured, skip all auth checks
  // Demo mode handles auth via localStorage in client-side code
  if (!IS_SUPABASE_CONFIGURED) {
    return response;
  }

  // Skip public paths
  if (isPublicPath(pathname)) {
    return response;
  }

  // Allow company slug paths through - client-side auth will handle
  // This supports routes like /pwc, /rt/login, etc.
  if (isCompanySlugPath(pathname)) {
    return response;
  }

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // If no session and not public path, redirect to login
  if (!session || sessionError) {
    // If on auth path, allow through
    if (isAuthPath(pathname)) {
      return response;
    }

    // Redirect to login with return URL
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and on auth path, redirect to home
  if (isAuthPath(pathname)) {
    return NextResponse.redirect(new URL(HOME_PATH, request.url));
  }

  // Get user profile to check role
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, status, is_active, company_id')
    .eq('id', session.user.id)
    .single();

  // Check if user exists and is active
  if (!userProfile || !userProfile.is_active || userProfile.status !== 'active') {
    // Sign out and redirect to login
    await supabase.auth.signOut();
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('error', 'account_disabled');
    return NextResponse.redirect(loginUrl);
  }

  // Check role authorization
  if (!ALLOWED_ROLES.includes(userProfile.role)) {
    // User doesn't have access to this portal
    await supabase.auth.signOut();
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('error', 'portal_access_denied');
    return NextResponse.redirect(loginUrl);
  }

  // Add user info to headers for downstream use
  response.headers.set('x-user-id', session.user.id);
  response.headers.set('x-user-role', userProfile.role);
  if (userProfile.company_id) {
    response.headers.set('x-company-id', userProfile.company_id);
  }

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
