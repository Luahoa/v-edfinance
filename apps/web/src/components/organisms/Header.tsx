'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, LayoutDashboard, LogOut, Trophy, ShoppingCart, PlayCircle } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import NavLink from '@/components/atoms/NavLink';
import LocaleSwitcher from '@/components/molecules/LocaleSwitcher';

export default function Header() {
  const t = useTranslations('Navigation');
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:bg-black/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
          <div className="h-8 w-8 rounded-lg bg-blue-600" />
          <span>Lúa Hóa</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <NavLink href="/courses" icon={<BookOpen />}>
            {t('courses')}
          </NavLink>
          <NavLink href="/dashboard" icon={<LayoutDashboard />}>
            {t('dashboard')}
          </NavLink>
          <NavLink href="/leaderboard" icon={<Trophy size={18} />}>
            {t('leaderboard')}
          </NavLink>
          <NavLink href="/store" icon={<ShoppingCart size={18} />}>
            {t('store')}
          </NavLink>
          <NavLink href="/simulation" icon={<PlayCircle size={18} />}>
            {t('simulation')}
          </NavLink>
        </nav>

        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          
          <button 
            onClick={handleLogout} 
            className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5 text-zinc-500 hover:text-red-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
