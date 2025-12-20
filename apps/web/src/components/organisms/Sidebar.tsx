'use client';

import { Link, usePathname } from '@/i18n/routing';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Gamepad2,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ className = '', onClose }: SidebarProps) {
  const t = useTranslations('Navigation');
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/courses', label: t('courses'), icon: BookOpen },
    { href: '/simulation', label: t('simulation'), icon: Gamepad2 },
    { href: '/leaderboard', label: t('leaderboard'), icon: Trophy },
    { href: '/social', label: t('social'), icon: Users },
    { href: '/store', label: t('store'), icon: ShoppingBag },
  ];

  return (
    <aside className={`bg-white dark:bg-zinc-900 ${className}`}>
      <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            V
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            V-EdFinance
          </span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
              }`}
            >
              <item.icon
                size={20}
                className={
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                }
              />
              {item.label}
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 transition-all"
        >
          <Settings size={20} className="text-zinc-400" />
          {t('settings') || 'Settings'}
        </Link>
      </div>
    </aside>
  );
}
