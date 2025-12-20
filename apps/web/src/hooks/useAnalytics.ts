'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';

export const useAnalytics = () => {
  const { user, token } = useAuthStore();
  const pathname = usePathname();

  const trackEvent = async (
    eventType: string, 
    actionCategory: string = 'GENERAL',
    payload: Record<string, unknown> = {},
    duration?: number
  ) => {
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
          actionCategory,
          payload,
          duration,
          deviceInfo: {
            userAgent: navigator.userAgent,
            screen: `${window.screen.width}x${window.screen.height}`,
          },
        }),
      });
    } catch {
      // Fail silently
    }
  };

  return { trackEvent };
};
