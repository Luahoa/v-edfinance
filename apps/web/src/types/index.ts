export interface LocalizedString {
  vi: string;
  en: string;
  zh?: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: LocalizedString;
  content: LocalizedString;
  videoKey?: string;
  order: number;
  type: 'VIDEO' | 'READING' | 'QUIZ';
}

export interface Course {
  id: string;
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
  thumbnailKey: string;
  level: string;
  lessons: Lesson[];
}

export interface DashboardStats {
  enrolledCoursesCount: number;
  completedLessonsCount: number;
  points: number;
  badgesCount?: number;
}

export interface Post {
  id: string;
  userId: string;
  type: 'ACHIEVEMENT' | 'MILESTONE' | 'NUDGE' | 'DISCUSSION';
  content: Record<string, unknown>; // Localized content
  likesCount: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    metadata: Record<string, unknown> | null;
  };
}

export interface BuddyGroup {
  id: string;
  name: string;
  description: string | null;
  type: 'LEARNING' | 'SAVING' | 'INVESTING';
  totalPoints: number;
  streak: number;
  members: BuddyMember[];
  challenges: BuddyChallenge[];
  _count?: {
    members: number;
  };
}

export interface BuddyMember {
  id: string;
  userId: string;
  role: 'LEADER' | 'MEMBER';
  user: {
    id: string;
    email: string;
    points: number;
    metadata: Record<string, unknown> | null;
    streaks?: {
      currentStreak: number;
    } | null;
  };
}

export interface BuddyChallenge {
  id: string;
  title: Record<string, string>;
  target: number;
  rewardPoints: number;
  expiresAt: string;
}

export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  STARTED = 'STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface UserProgress {
  userId: string;
  lessonId: string;
  status: ProgressStatus;
  durationSpent: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
