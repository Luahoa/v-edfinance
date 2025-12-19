import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip auth check for public files and api
  if (
    pathname.includes('.') || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api')
  ) {
    return intlMiddleware(request);
  }

  // 2. Auth check
  const token = request.cookies.get('token')?.value;
  const isAuthPage = pathname.match(/\/(vi|en|zh)\/(login|register)/);
  const isProtectedPage = pathname.match(/\/(vi|en|zh)\/(dashboard|courses)/);

  if (isProtectedPage && !token) {
    // Redirect to login if trying to access protected page without token
    const locale = pathname.split('/')[1] || 'vi';
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return Response.redirect(loginUrl);
  }

  if (isAuthPage && token) {
    // Redirect to dashboard if trying to access login page while authenticated
    const locale = pathname.split('/')[1] || 'vi';
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return Response.redirect(dashboardUrl);
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
