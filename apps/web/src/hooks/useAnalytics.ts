'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';

export const useAnalytics = () => {
  const { user, token } = useAuthStore();
  const pathname = usePathname();

  const trackEvent = async (eventType: string, payload: Record<string, unknown> = {}) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/behavior/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId: 'session-' + (user?.id || 'guest'),
          path: pathname,
          eventType,
          payload,
        }),
      });
    } catch {
      // Fail silently to not interrupt user experience
    }
  };

  return { trackEvent };
};
