'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationShortcut {
  key: string;
  href: string;
  altKey: boolean;
}

const shortcuts: NavigationShortcut[] = [
  { key: 'h', href: '/dashboard', altKey: true },  // Alt+H → Dashboard (Home)
  { key: 'l', href: '/learn', altKey: true },       // Alt+L → Learn
  { key: 'p', href: '/practice', altKey: true },    // Alt+P → Practice
  { key: 's', href: '/social', altKey: true },      // Alt+S → Social
];

export function useNavigationShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check for matching shortcuts
      for (const shortcut of shortcuts) {
        if (
          e.key.toLowerCase() === shortcut.key &&
          e.altKey === shortcut.altKey &&
          !e.ctrlKey &&
          !e.metaKey
        ) {
          e.preventDefault();
          router.push(shortcut.href);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
