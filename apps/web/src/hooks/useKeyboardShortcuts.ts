import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const matchedShortcut = shortcuts.find((shortcut) => {
        return (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.altKey === !!shortcut.altKey &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.metaKey === !!shortcut.metaKey &&
          !!event.shiftKey === !!shortcut.shiftKey
        );
      });

      if (matchedShortcut) {
        event.preventDefault();
        matchedShortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

interface NavigationShortcuts {
  dashboard: string;
  learn: string;
  practice: string;
  social: string;
}

export function useNavigationShortcuts() {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'h',
      altKey: true,
      action: () => router.push('/dashboard'),
      description: 'Go to Dashboard (Alt+H)',
    },
    {
      key: 'l',
      altKey: true,
      action: () => router.push('/learn'),
      description: 'Go to Learn (Alt+L)',
    },
    {
      key: 'p',
      altKey: true,
      action: () => router.push('/practice'),
      description: 'Go to Practice (Alt+P)',
    },
    {
      key: 's',
      altKey: true,
      action: () => router.push('/social'),
      description: 'Go to Social (Alt+S)',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}

export const navigationShortcuts: NavigationShortcuts = {
  dashboard: 'Alt+H',
  learn: 'Alt+L',
  practice: 'Alt+P',
  social: 'Alt+S',
};
