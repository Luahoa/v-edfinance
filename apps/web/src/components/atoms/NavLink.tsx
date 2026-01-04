'use client';

import { Link } from '@/i18n/routing';
import { usePathname } from '@/i18n/routing';
import { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
}

export default function NavLink({ href, children, icon }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link 
      href={href} 
      className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-blue-600 ${
        isActive ? 'text-blue-600' : 'text-zinc-600 dark:text-zinc-400'
      }`}
    >
      {icon && <span className="h-4 w-4">{icon}</span>}
      {children}
    </Link>
  );
}
