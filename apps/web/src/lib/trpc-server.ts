import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface TRPCBatchResponse<T> {
  result: {
    data: T;
  };
}

interface TRPCErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

type TRPCResponse<T> = TRPCBatchResponse<T> | TRPCErrorResponse;

async function getAuthHeaders(): Promise<HeadersInit> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

async function trpcQuery<T>(
  path: string,
  input?: Record<string, unknown>,
  options?: { revalidate?: number }
): Promise<T | null> {
  try {
    const headers = await getAuthHeaders();
    const inputParam = input ? `?input=${encodeURIComponent(JSON.stringify(input))}` : '';
    
    const res = await fetch(`${API_URL}/trpc/${path}${inputParam}`, {
      headers,
      next: { revalidate: options?.revalidate ?? 60 },
    });

    if (!res.ok) return null;
    
    const data: TRPCResponse<T> = await res.json();
    
    if ('error' in data) {
      console.error(`tRPC error [${path}]:`, data.error);
      return null;
    }
    
    return data.result.data;
  } catch (error) {
    console.error(`tRPC fetch error [${path}]:`, error);
    return null;
  }
}

export const serverTrpc = {
  course: {
    list: (input?: { level?: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT'; limit?: number; offset?: number }) =>
      trpcQuery<Array<{
        id: string;
        slug: string;
        title: Record<string, string>;
        description: Record<string, string>;
        thumbnailKey: string;
        price: number;
        level: string;
        published: boolean;
        createdAt: string;
      }>>('course.list', input, { revalidate: 3600 }),
    
    getBySlug: (slug: string) =>
      trpcQuery<{
        id: string;
        slug: string;
        title: Record<string, string>;
        description: Record<string, string>;
        thumbnailKey: string;
        price: number;
        level: string;
        lessons: Array<{
          id: string;
          title: Record<string, string>;
          order: number;
          type: string;
          duration: number | null;
        }>;
      }>('course.getBySlug', { slug }),
  },

  user: {
    me: () =>
      trpcQuery<{
        id: string;
        email: string;
        name: Record<string, string> | null;
        role: string;
        points: number;
      }>('user.me'),
    
    getStats: () =>
      trpcQuery<{
        enrolledCoursesCount: number;
        completedLessonsCount: number;
        points: number;
        streak: number;
      }>('user.getStats'),
  },

  social: {
    getFeed: (limit?: number) =>
      trpcQuery<Array<{
        id: string;
        content: string;
        type: string;
        createdAt: string;
        user: { id: string; name: Record<string, string> | null };
      }>>('social.feed', { limit: limit ?? 10 }),
    
    getRecommendations: () =>
      trpcQuery<Array<{
        id: string;
        name: string;
        description: string | null;
        type: string;
        memberCount: number;
      }>>('social.getRecommendations', undefined, { revalidate: 300 }),
  },

  analytics: {
    getLearningStats: () =>
      trpcQuery<{
        lessonsCompleted: number;
        totalTimeSpent: number;
        lessonsStarted: number;
      }>('analytics.getLearningStats'),
    
    getStreak: () =>
      trpcQuery<{
        currentStreak: number;
        longestStreak: number;
        lastActivityDate: string | null;
      }>('analytics.getStreak'),
  },

  lesson: {
    getById: (id: string) =>
      trpcQuery<{
        id: string;
        courseId: string;
        title: Record<string, string>;
        content: Record<string, string>;
        videoKey: Record<string, string> | null;
        type: string;
        duration: number | null;
        order: number;
        course: {
          id: string;
          title: Record<string, string>;
          slug: string;
        };
      }>('lesson.getById', { id }),
    
    getByCourse: (courseId: string) =>
      trpcQuery<Array<{
        id: string;
        title: Record<string, string>;
        order: number;
        type: string;
        duration: number | null;
      }>>('lesson.getByCourse', { courseId }),
  },

  certificate: {
    getMyCertificates: () =>
      trpcQuery<Array<{
        id: string;
        studentName: Record<string, string>;
        courseTitle: Record<string, string>;
        completedAt: string;
        pdfUrl: string | null;
        course: {
          id: string;
          slug: string;
        };
      }>>('certificate.getMyCertificates'),
  },

  payment: {
    getTransactionByCourse: (courseId: string) =>
      trpcQuery<{
        purchased: boolean;
        transaction: {
          id: string;
          status: string;
          completedAt: string | null;
        } | null;
      }>('payment.getTransactionByCourse', { courseId }),
  },
};
