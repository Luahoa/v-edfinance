'use client';
import { cn } from '@/lib/cn';

import { Link, usePathname } from '@/i18n/routing';
import { motion } from 'framer-motion';
import { Icons } from '@/lib/icons';
import { useTranslations } from 'next-intl';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
    className?: string;
    onClose?: () => void;
}

export default function Sidebar({ className = '', onClose }: SidebarProps) {
    const t = useTranslations('Navigation');
    const pathname = usePathname();

    // Primary navigation items (4+1 pattern)
    const primaryItems = [
        { href: '/dashboard', label: t('dashboard'), icon: Icons.LayoutDashboard || Icons.Award, shortcut: 'Alt+H' },
        { href: '/learn', label: t('learn'), icon: Icons.BookOpen, shortcut: 'Alt+L' },
        { href: '/practice', label: t('practice'), icon: Icons.Play || Icons.Zap, shortcut: 'Alt+P' },
        { href: '/social', label: t('social'), icon: Icons.Users, shortcut: 'Alt+S' },
    ];

    // Secondary navigation items (in "More" dropdown)
    const secondaryItems = [
        { href: '/store', label: t('store'), icon: Icons.ArrowRight },
        { href: '/leaderboard', label: t('leaderboard'), icon: Icons.Award },
        { href: '/settings', label: t('settings'), icon: Icons.Settings },
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
                        type="button"
                        onClick={onClose}
                        className="lg:hidden p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                        aria-label="Close sidebar"
                    >
                        <Icons.X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                {primaryItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
                                }`}
                        >
                            <item.icon
                                className={
                                    cn('w-5 h-5', isActive
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                                    )
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

                {/* More dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="w-full group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                            aria-label="More options"
                        >
                            <Icons.MoreHorizontal className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
                            {t('more')}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        {secondaryItems.map((item) => (
                            <DropdownMenuItem key={item.href} asChild>
                                <Link
                                    href={item.href}
                                    onClick={onClose}
                                    className="flex items-center gap-3 cursor-pointer"
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </nav>
        </aside>
    );
}
