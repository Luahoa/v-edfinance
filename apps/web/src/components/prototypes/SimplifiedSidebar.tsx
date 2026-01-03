'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, BookOpen, Target, Users, MoreHorizontal, ShoppingCart, User, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const primaryNav = [
  { href: '/dashboard', icon: Home, label: 'dashboard', shortcut: 'Alt+H' },
  { href: '/learn', icon: BookOpen, label: 'learn', shortcut: 'Alt+L' },
  { href: '/practice', icon: Target, label: 'practice', shortcut: 'Alt+P' },
  { href: '/social', icon: Users, label: 'social', shortcut: 'Alt+S' },
];

const secondaryNav = [
  { href: '/store', icon: ShoppingCart, label: 'store' },
  { href: '/profile', icon: User, label: 'profile' },
  { href: '/settings', icon: Settings, label: 'settings' },
  { href: '/help', icon: HelpCircle, label: 'help' },
];

export function SimplifiedSidebar() {
  const pathname = usePathname();
  const t = useTranslations('Navigation');

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-purple-500 rounded-lg" />
          <h1 className="text-xl font-bold text-white">V-EdFinance</h1>
        </Link>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                'hover:bg-slate-800/50',
                isActive && 'bg-slate-800 text-amber-500 font-semibold'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1">{t(item.label)}</span>
              <kbd className="hidden lg:block text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                {item.shortcut}
              </kbd>
            </Link>
          );
        })}

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                'hover:bg-slate-800/50 text-slate-300'
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="flex-1">{t('more')}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-48 bg-slate-900 border-slate-800">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 cursor-pointer',
                      isActive && 'text-amber-500 font-semibold'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t(item.label)}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </aside>
  );
}
