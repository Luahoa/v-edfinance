import { useAuthStore } from '@/store/useAuthStore';

/**
 * Smart Nudge Engine
 *
 * Based on Behavioral Economics (Richard Thaler - Nudge Theory):
 * 1. Loss Aversion: Fear of losing streaks
 * 2. Social Proof: "Others are doing it"
 * 3. Scarcity: Limited-time opportunities
 * 4. Default Bias: Pre-selected good choices
 * 5. Framing: Positive vs negative messaging
 */

export interface NudgeConfig {
  type: 'streak' | 'social' | 'loss_aversion' | 'milestone' | 'reminder' | 'scarcity';
  trigger: (userData: Record<string, unknown>) => boolean;
  message: (data: Record<string, unknown>) => string;
  action: { label: string; href: string };
  priority: number; // 1-5 (5 = highest)
  variant: 'info' | 'warning' | 'success' | 'danger';
  icon?: string; // emoji
  dismissable?: boolean;
  frequency?: 'once' | 'daily' | 'session' | 'always'; // How often to show
}

export class NudgeEngine {
  private nudges: NudgeConfig[] = [
    // 1. Loss Aversion: Streak at Risk (HIGHEST PRIORITY)
    {
      type: 'streak',
      trigger: (userData) => {
        const lastActiveDate = userData.lastActiveDate || localStorage.getItem('lastActiveDate');
        const today = new Date().toDateString();
        const streak = userData.streak || 0;

        // Show if user hasn't been active today AND has a streak to lose
        return lastActiveDate !== today && streak > 0;
      },
      message: (data) => {
        const emoji = data.streak >= 7 ? '🔥' : '⚡';
        return `${emoji} Don't break your ${data.streak}-day streak! Complete one lesson today.`;
      },
      action: { label: 'Continue Learning', href: '/courses' },
      priority: 5,
      variant: 'warning',
      icon: '🔥',
      dismissable: false,
      frequency: 'daily',
    },

    // 2. Social Proof: Popular Courses
    {
      type: 'social',
      trigger: () => true, // Always available if data exists
      message: (data) => {
        return `👥 ${data.count || '127'} learners completed "${data.courseName || 'Financial Basics'}" this hour`;
      },
      action: { label: 'Join Them', href: '/courses' },
      priority: 3,
      variant: 'info',
      icon: '👥',
      dismissable: true,
      frequency: 'session',
    },

    // 3. Milestone Progress (Positive Framing)
    {
      type: 'milestone',
      trigger: (userData) => {
        const points = userData.points || 0;
        const nextMilestone = Math.ceil(points / 1000) * 1000;
        const remaining = nextMilestone - points;

        // Show when within 20% of next milestone
        return remaining > 0 && remaining <= 200;
      },
      message: (data) => {
        const nextLevel = Math.ceil(data.points / 1000) * 1000;
        const remaining = nextLevel - data.points;
        return `🎉 Only ${remaining} points until you unlock Level ${nextLevel / 1000} Badge!`;
      },
      action: { label: 'Earn Points', href: '/courses' },
      priority: 4,
      variant: 'success',
      icon: '🎯',
      dismissable: true,
      frequency: 'daily',
    },

    // 4. Scarcity: Limited-Time Offer
    {
      type: 'scarcity',
      trigger: (userData) => {
        // Check if user hasn't completed a course in 7 days
        const lastCourseDate = userData.lastCourseCompletionDate;
        if (!lastCourseDate) return false;

        const daysSince = Math.floor(
          (Date.now() - new Date(lastCourseDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSince >= 7;
      },
      message: () => {
        return '⏰ Weekend Bonus: Earn 2x points on all courses until Sunday!';
      },
      action: { label: 'Start Learning', href: '/courses' },
      priority: 4,
      variant: 'warning',
      icon: '⚡',
      dismissable: true,
      frequency: 'daily',
    },

    // 5. Reminder: Incomplete Lessons
    {
      type: 'reminder',
      trigger: (userData) => {
        return (userData.incompleteLessons || 0) > 0;
      },
      message: (data) => {
        const count = data.incompleteLessons;
        return `📚 You have ${count} lesson${count > 1 ? 's' : ''} in progress. Pick up where you left off!`;
      },
      action: { label: 'Resume Learning', href: '/dashboard' },
      priority: 2,
      variant: 'info',
      icon: '📚',
      dismissable: true,
      frequency: 'session',
    },

    // 6. Loss Aversion: Points Expiring (Hypothetical)
    {
      type: 'loss_aversion',
      trigger: (userData) => {
        // Example: Points expire if not used within 30 days
        const lastPointsUsedDate = userData.lastPointsUsedDate;
        if (!lastPointsUsedDate) return false;

        const daysSince = Math.floor(
          (Date.now() - new Date(lastPointsUsedDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSince >= 25; // Warn 5 days before expiry
      },
      message: (data) => {
        const points = data.unusedPoints || 0;
        return `⚠️ ${points} points will expire in 5 days! Use them in the Rewards Store.`;
      },
      action: { label: 'View Rewards', href: '/rewards' },
      priority: 5,
      variant: 'danger',
      icon: '⚠️',
      dismissable: false,
      frequency: 'daily',
    },
  ];

  /**
   * Get the top priority nudge for current user
   */
  async getTopNudge(userData: Record<string, unknown>): Promise<NudgeConfig | null> {
    // Filter nudges based on triggers
    const activeNudges = this.nudges.filter((nudge) => {
      try {
        return nudge.trigger(userData);
      } catch (error) {
        console.error('Nudge trigger error:', nudge.type, error);
        return false;
      }
    });

    if (activeNudges.length === 0) return null;

    // Check dismissal status
    const visibleNudges = activeNudges.filter((nudge) => {
      const dismissKey = `nudge-dismissed-${nudge.type}`;
      const dismissed = localStorage.getItem(dismissKey);

      if (!dismissed) return true;

      // Check frequency
      if (nudge.frequency === 'once') return false;
      if (nudge.frequency === 'daily') {
        const dismissDate = new Date(dismissed).toDateString();
        const today = new Date().toDateString();
        return dismissDate !== today;
      }
      if (nudge.frequency === 'session') {
        const sessionStart = sessionStorage.getItem('sessionStart');
        return sessionStart !== dismissed;
      }

      return true;
    });

    if (visibleNudges.length === 0) return null;

    // Sort by priority (descending)
    visibleNudges.sort((a, b) => b.priority - a.priority);

    return visibleNudges[0];
  }

  /**
   * Dismiss a nudge
   */
  dismissNudge(type: string) {
    const dismissKey = `nudge-dismissed-${type}`;
    const sessionStart = sessionStorage.getItem('sessionStart') || new Date().toISOString();

    localStorage.setItem(dismissKey, sessionStart);
  }

  /**
   * Track nudge interaction for analytics
   */
  async trackNudgeInteraction(type: string, action: 'shown' | 'clicked' | 'dismissed') {
    try {
      const token = useAuthStore.getState().token;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      await fetch(`${API_URL}/analytics/nudge-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          nudgeType: type,
          action,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to track nudge interaction:', error);
    }
  }
}

/**
 * Nudge Personalization Engine
 * Uses behavioral data to optimize nudge delivery
 */
export class NudgePersonalization {
  /**
   * Calculate optimal nudge timing based on user activity patterns
   */
  getOptimalNudgeTime(activityLog: Array<{ timestamp: string | number | Date }>): Date {
    // Analyze historical activity to find peak engagement time
    const hourCounts = new Array(24).fill(0);

    activityLog.forEach((log) => {
      const hour = new Date(log.timestamp).getHours();
      hourCounts[hour]++;
    });

    // Find peak hour
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    // Return next occurrence of peak hour
    const now = new Date();
    const nextPeak = new Date();
    nextPeak.setHours(peakHour, 0, 0, 0);

    if (nextPeak <= now) {
      nextPeak.setDate(nextPeak.getDate() + 1);
    }

    return nextPeak;
  }

  /**
   * A/B test nudge messages
   */
  selectNudgeVariant(type: string): string {
    const variants = {
      streak: ["Don't break your streak!", 'Keep your streak alive!', 'Your streak needs you!'],
      social: ['Join other learners', 'Popular right now', 'Trending course'],
    };

    const options = variants[type as keyof typeof variants] || [''];
    return options[Math.floor(Math.random() * options.length)];
  }
}

/**
 * Hook to use nudge engine in components
 */
export function useNudgeEngine() {
  const engine = new NudgeEngine();
  const personalization = new NudgePersonalization();

  return {
    getTopNudge: engine.getTopNudge.bind(engine),
    dismissNudge: engine.dismissNudge.bind(engine),
    trackInteraction: engine.trackNudgeInteraction.bind(engine),
    getOptimalTime: personalization.getOptimalNudgeTime.bind(personalization),
  };
}
