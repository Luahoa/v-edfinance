'use client';

import { Badge } from '@/components/atoms/Badge';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/useAuthStore';
import { Icons } from '@/lib/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

/**
 * Mobile Navigation
 *
 * Features:
 * - Bottom navigation bar (thumb-friendly)
 * - Hamburger menu for secondary links
 * - Active state indicators
 * - Badge notifications
 */

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  requiresAuth?: boolean;
}

const primaryNavItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Icons.Home || Icons.ArrowRight },
  { href: '/courses', label: 'Courses', icon: Icons.BookOpen, requiresAuth: false },
  { href: '/dashboard', label: 'Dashboard', icon: Icons.LayoutDashboard || Icons.Award, requiresAuth: true },
  { href: '/social', label: 'Community', icon: Icons.Users, requiresAuth: true },
  { href: '/profile', label: 'Profile', icon: Icons.User || Icons.Users, requiresAuth: true },
];


export function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  // Filter items based on auth status
  const visibleItems = primaryNavItems.filter((item) => !item.requiresAuth || isAuthenticated);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5', isActive && 'scale-110')} />

                {/* Badge Indicator */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>

              <span className={cn('text-xs font-medium', isActive && 'font-semibold')}>
                {item.label}
              </span>

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Mobile Menu Drawer
 * For secondary navigation and settings
 */
export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  const secondaryItems = [
    { href: '/achievements', label: 'Achievements', icon: Icons.Award, requiresAuth: true },
    { href: '/leaderboard', label: 'Leaderboard', icon: Icons.Award, requiresAuth: true },
    { href: '/settings', label: 'Settings', icon: Icons.User || Icons.Users, requiresAuth: true },
    { href: '/help', label: 'Help & Support', icon: Icons.Home || Icons.ArrowRight, requiresAuth: false },
  ];

  const visibleSecondary = secondaryItems.filter((item) => !item.requiresAuth || isAuthenticated);

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-40 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg"
        aria-label="Open menu"
      >
        <Icons.Menu className="w-6 h-6" />
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-zinc-900 shadow-2xl lg:hidden transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Menu</h2>
              {isAuthenticated && user && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{user.email}</p>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Close menu"
            >
              <Icons.X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-2">
              {visibleSecondary.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-zinc-200 dark:border-zinc-800">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  useAuthStore.getState().logout();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                Logout
              </button>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-center transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-4 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold rounded-lg text-center hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Desktop Navigation Header
 * Responsive header for larger screens
 */
export function DesktopNav() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  return (
    <header className="hidden lg:block sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              V
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">V-EdFinance</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            {primaryNavItems.slice(0, 4).map((item) => {
              if (item.requiresAuth && !isAuthenticated) return null;

              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors',
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge variant="danger" size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.email?.[0].toUpperCase()}
                </div>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {user?.email?.split('@')[0]}
                </span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
