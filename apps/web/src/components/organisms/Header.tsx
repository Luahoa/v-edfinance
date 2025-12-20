'use client';

import LocaleSwitcher from '@/components/molecules/LocaleSwitcher';
import { usePathname, useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/store/useAuthStore';
import { AnimatePresence, motion } from 'framer-motion';
import Cookies from 'js-cookie';
import { Bell, ChevronRight, LogOut, Menu, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Header() {
  const t = useTranslations('Navigation');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    Cookies.remove('token');
    router.push('/login');
  };

  // Simple Breadcrumbs logic
  const pathSegments = pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 lg:hidden rounded-lg"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-2 text-sm font-medium">
          <span className="text-zinc-400">App</span>
          {pathSegments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight size={14} className="text-zinc-400" />
              <span
                className={
                  index === pathSegments.length - 1
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500'
                }
              >
                {segment.charAt(0).toUpperCase() + segment.slice(1)}
              </span>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <LocaleSwitcher />

        <button className="relative p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-zinc-900" />
        </button>

        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 rounded-full border border-zinc-200 p-1 pr-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-all"
          >
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold overflow-hidden">
              {user?.name ? (typeof user.name === 'string' ? user.name.charAt(0) : 'U') : 'U'}
            </div>
            <span className="hidden md:inline text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {typeof user?.name === 'string' ? user.name : 'User'}
            </span>
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-20"
                >
                  <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-all">
                    <User size={18} />
                    {t('profile') || 'Profile'}
                  </button>
                  <hr className="my-1 border-zinc-200 dark:border-zinc-800" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                  >
                    <LogOut size={18} />
                    {t('logout') || 'Logout'}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
            >
              <Sidebar
                className="h-full border-r border-zinc-200 dark:border-zinc-800 shadow-2xl"
                onClose={() => setIsMobileMenuOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
