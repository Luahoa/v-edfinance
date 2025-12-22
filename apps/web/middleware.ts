import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './src/i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Define protected and public routes (without locale prefix)
const protectedRoutes = [
  '/dashboard',
  '/courses',
  '/leaderboard',
  '/simulation',
  '/social',
  '/store',
  '/onboarding',
];
const authRoutes = ['/login', '/register'];

// V-SEC-002: Whitelist for public API routes (explicit security)
// By default, all /api routes require authentication
const publicApiRoutes = [
  '/api/health',
  '/api/_next',
  // Add other public API routes explicitly here
];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip auth check for public files and metadata only
  if (pathname.includes('.') || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return intlMiddleware(request);
  }

  // 2. V-SEC-002: Handle API routes with explicit security
  if (pathname.startsWith('/api')) {
    // Check if it's a whitelisted public API route
    const isPublicApi = publicApiRoutes.some((route) => pathname.startsWith(route));

    if (!isPublicApi) {
      // Protected API route - require authentication
      const token = request.cookies.get('token')?.value;
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return intlMiddleware(request);
  }

  // 3. Extract locale and pure path
  const segments = pathname.split('/');
  const locale = segments[1];
  const purePath = `/${segments.slice(2).join('/')}`;

  const token = request.cookies.get('token')?.value;

  // 4. Auth Logic for protected pages
  const isProtectedRoute = protectedRoutes.some((route) => purePath.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => purePath.startsWith(route));

  if (isProtectedRoute && !token) {
    const loginUrl = new URL(`/${locale || 'vi'}/login`, request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    const dashboardUrl = new URL(`/${locale || 'vi'}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(vi|en|zh)/:path*', '/((?!_next|_vercel|.*\\..*).*)'],
};
