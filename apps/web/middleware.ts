import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// Define protected and public routes (without locale prefix)
const protectedRoutes = ['/dashboard', '/courses', '/leaderboard', '/simulation', '/social', '/store', '/onboarding'];
const authRoutes = ['/login', '/register'];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip auth check for public files, api, and metadata
  if (
    pathname.includes('.') || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return intlMiddleware(request);
  }

  // 2. Extract locale and pure path
  const segments = pathname.split('/');
  const locale = segments[1];
  const purePath = '/' + segments.slice(2).join('/');
  
  const token = request.cookies.get('token')?.value;

  // 3. Auth Logic
  const isProtectedRoute = protectedRoutes.some(route => purePath.startsWith(route));
  const isAuthRoute = authRoutes.some(route => purePath.startsWith(route));

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
  matcher: [
    '/',
    '/(vi|en|zh)/:path*',
    '/((?!_next|_vercel|.*\\..*).*)'
  ],
};
