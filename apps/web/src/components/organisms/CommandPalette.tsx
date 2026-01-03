'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, Home, BookOpen, Play, Users, Store, Trophy, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

interface Command {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  keywords: string[];
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const t = useTranslations('Navigation');

  const commands: Command[] = [
    { id: 'dashboard', label: t('dashboard'), href: '/dashboard', icon: Home, category: 'Navigation', keywords: ['home', 'dashboard', 'trang chủ'] },
    { id: 'learn', label: t('learn'), href: '/learn', icon: BookOpen, category: 'Navigation', keywords: ['learn', 'courses', 'học tập', 'khóa học'] },
    { id: 'practice', label: t('practice'), href: '/practice', icon: Play, category: 'Navigation', keywords: ['practice', 'simulation', 'thực hành', 'giả lập'] },
    { id: 'social', label: t('social'), href: '/social', icon: Users, category: 'Navigation', keywords: ['social', 'community', 'cộng đồng'] },
    { id: 'store', label: t('store'), href: '/store', icon: Store, category: 'Navigation', keywords: ['store', 'shop', 'cửa hàng'] },
    { id: 'leaderboard', label: t('leaderboard'), href: '/leaderboard', icon: Trophy, category: 'Navigation', keywords: ['leaderboard', 'ranking', 'xếp hạng'] },
    { id: 'settings', label: t('settings'), href: '/settings', icon: Settings, category: 'Navigation', keywords: ['settings', 'preferences', 'cài đặt'] },
  ];

  const filteredCommands = commands.filter((cmd) => {
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(searchLower))
    );
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Command Palette */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl mx-4 pointer-events-auto"
            >
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800">
                  <Search className="w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search commands... (CMD+K to toggle)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>

                {/* Commands List */}
                <div className="max-h-96 overflow-y-auto">
                  {filteredCommands.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">
                      No commands found for &ldquo;{search}&rdquo;
                    </div>
                  ) : (
                    <div className="p-2">
                      {filteredCommands.map((cmd) => {
                        const Icon = cmd.icon;
                        return (
                          <button
                            type="button"
                            key={cmd.id}
                            onClick={() => handleSelect(cmd.href)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-lg',
                              'text-left transition-colors',
                              'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                              'focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:outline-none'
                            )}
                          >
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                {cmd.label}
                              </div>
                              <div className="text-xs text-zinc-500">
                                {cmd.category}
                              </div>
                            </div>
                            <div className="text-xs text-zinc-400">
                              {cmd.href}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-xs text-zinc-500">
                  <div className="flex items-center gap-4">
                    <span>
                      <kbd className="px-2 py-1 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                        ↑↓
                      </kbd>{' '}
                      Navigate
                    </span>
                    <span>
                      <kbd className="px-2 py-1 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                        Enter
                      </kbd>{' '}
                      Select
                    </span>
                    <span>
                      <kbd className="px-2 py-1 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                        Esc
                      </kbd>{' '}
                      Close
                    </span>
                  </div>
                  <div>
                    <kbd className="px-2 py-1 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                      CMD+K
                    </kbd>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
