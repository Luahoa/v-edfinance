import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'vi', 'zh'],
  defaultLocale: 'vi',
});

export const config = {
  // Match all pathnames except for
  // - API routes (/api/*)
  // - Static files (/_next/*, /favicon.ico, etc.)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
