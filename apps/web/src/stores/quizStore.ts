/**
 * Quiz Store - Production Implementation
 * Based on spike: .spikes/phase1-mvp/quiz-spike/store-pattern.ts
 * Learnings:
 * - Custom Zustand with persist (10-35ms re-render)
 * - Must reset after submission to prevent state leakage
 * - userId in localStorage key to avoid conflicts
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPES (aligned with API models)
// ============================================================================

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'MATCHING';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: Record<string, string>; // Localized: { vi, en, zh }
  options?: Record<string, any>; // For MULTIPLE_CHOICE, MATCHING
  points: number;
  order: number;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: Record<string, string>; // Localized
  description?: Record<string, string>; // Localized
  published: boolean;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id?: string;
  quizId: string;
  answers: Record<string, any>; // { questionId: userAnswer }
  score?: number;
  percentage?: number;
  startedAt?: Date;
  completedAt?: Date;
}

interface QuizState {
  // State
  quiz: Quiz | null;
  currentQuestionIndex: number;
  answers: Record<string, any>;
  startTime: number | null;
  endTime: number | null;
  attempt: QuizAttempt | null;
  
  // UI States
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Retry logic
  retryCount: number;
  maxRetries: number;

  // Actions - Quiz Loading
  fetchQuizForAttempt: (quizId: string, userId: string) => Promise<void>;
  loadQuiz: (quiz: Quiz) => void;

  // Actions - Quiz Taking
  answerQuestion: (questionId: string, answer: any) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;

  // Actions - Quiz Submission
  submitQuiz: (userId: string) => Promise<void>;
  
  // Actions - Reset
  resetQuiz: () => void;
  clearError: () => void;
}

// ============================================================================
// API INTEGRATION
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Fetch quiz for student attempt (no correct answers)
 */
async function fetchQuiz(quizId: string, token: string): Promise<Quiz> {
  const response = await fetch(`${API_BASE}/quiz/${quizId}/attempt`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch quiz');
  }

  return response.json();
}

/**
 * Submit quiz attempt
 */
async function submitQuizAttempt(
  quizId: string,
  answers: Record<string, any>,
  token: string
): Promise<QuizAttempt> {
  const response = await fetch(`${API_BASE}/quiz/${quizId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      quizId,
      answers,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit quiz');
  }

  return response.json();
}

/**
 * Get auth token from localStorage (adjust based on your auth implementation)
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      // Initial State
      quiz: null,
      currentQuestionIndex: 0,
      answers: {},
      startTime: null,
      endTime: null,
      attempt: null,
      isLoading: false,
      isSubmitting: false,
      error: null,
      retryCount: 0,
      maxRetries: 3,

      // Fetch Quiz for Attempt
      fetchQuizForAttempt: async (quizId: string, userId: string) => {
        const token = getAuthToken();
        if (!token) {
          set({ error: 'Not authenticated' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const quiz = await fetchQuiz(quizId, token);
          
          set({
            quiz,
            currentQuestionIndex: 0,
            answers: {},
            startTime: Date.now(),
            endTime: null,
            attempt: null,
            isLoading: false,
            error: null,
            retryCount: 0,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to load quiz',
            isLoading: false,
          });
        }
      },

      // Load Quiz (from external source)
      loadQuiz: (quiz: Quiz) => {
        set({
          quiz,
          currentQuestionIndex: 0,
          answers: {},
          startTime: Date.now(),
          endTime: null,
          attempt: null,
          isLoading: false,
          error: null,
        });
      },

      // Answer Question
      answerQuestion: (questionId: string, answer: any) => {
        const { answers } = get();
        
        set({
          answers: {
            ...answers,
            [questionId]: answer,
          },
        });
      },

      // Navigation - Next Question
      nextQuestion: () => {
        const { quiz, currentQuestionIndex } = get();
        if (!quiz) return;

        const nextIndex = Math.min(
          currentQuestionIndex + 1,
          quiz.questions.length - 1
        );

        set({ currentQuestionIndex: nextIndex });
      },

      // Navigation - Previous Question
      previousQuestion: () => {
        const { currentQuestionIndex } = get();
        const prevIndex = Math.max(currentQuestionIndex - 1, 0);
        set({ currentQuestionIndex: prevIndex });
      },

      // Navigation - Go to Specific Question
      goToQuestion: (index: number) => {
        const { quiz } = get();
        if (!quiz) return;

        const validIndex = Math.max(0, Math.min(index, quiz.questions.length - 1));
        set({ currentQuestionIndex: validIndex });
      },

      // Submit Quiz with Retry Logic
      submitQuiz: async (userId: string) => {
        const { quiz, answers, retryCount, maxRetries } = get();
        if (!quiz) {
          set({ error: 'No quiz loaded' });
          return;
        }

        const token = getAuthToken();
        if (!token) {
          set({ error: 'Not authenticated' });
          return;
        }

        set({ isSubmitting: true, error: null });

        try {
          const attempt = await submitQuizAttempt(quiz.id, answers, token);

          set({
            attempt,
            endTime: Date.now(),
            isSubmitting: false,
            error: null,
            retryCount: 0,
          });

          // CRITICAL: Reset quiz after showing results (5 seconds)
          // Prevents state leakage to next quiz attempt
          setTimeout(() => {
            get().resetQuiz();
          }, 5000);
        } catch (error: any) {
          // Retry logic for network failures
          if (retryCount < maxRetries) {
            set({ retryCount: retryCount + 1 });
            
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, retryCount) * 1000;
            
            setTimeout(() => {
              get().submitQuiz(userId);
            }, delay);
          } else {
            set({
              error: error.message || 'Failed to submit quiz after retries',
              isSubmitting: false,
            });
          }
        }
      },

      // Reset Quiz (clears all state)
      resetQuiz: () => {
        set({
          quiz: null,
          currentQuestionIndex: 0,
          answers: {},
          startTime: null,
          endTime: null,
          attempt: null,
          isLoading: false,
          isSubmitting: false,
          error: null,
          retryCount: 0,
        });
      },

      // Clear Error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      // CRITICAL: Include userId in storage key to avoid conflicts between users
      name: (state) => {
        // Try to get userId from token/auth state
        // Fallback to 'quiz-storage' if no user
        const token = getAuthToken();
        if (!token) return 'quiz-storage';
        
        try {
          // Decode JWT to get userId (basic implementation)
          const payload = JSON.parse(atob(token.split('.')[1]));
          return `quiz-storage-${payload.userId || 'guest'}`;
        } catch {
          return 'quiz-storage';
        }
      },
      
      // Only persist quiz state, not UI states
      partialize: (state) => ({
        quiz: state.quiz,
        currentQuestionIndex: state.currentQuestionIndex,
        answers: state.answers,
        startTime: state.startTime,
      }),
    }
  )
);

// ============================================================================
// MEMOIZED SELECTORS (Performance Optimization)
// ============================================================================

/**
 * Get current question (prevents re-renders)
 * Spike validated: 10-35ms performance
 */
export const useCurrentQuestion = () => {
  return useQuizStore((state) => {
    if (!state.quiz) return null;
    return state.quiz.questions[state.currentQuestionIndex];
  });
};

/**
 * Get quiz progress (percentage complete)
 */
export const useQuizProgress = () => {
  return useQuizStore((state) => {
    if (!state.quiz) return 0;
    const answeredCount = Object.keys(state.answers).length;
    return Math.round((answeredCount / state.quiz.questions.length) * 100);
  });
};

/**
 * Check if quiz is complete (all questions answered)
 */
export const useIsQuizComplete = () => {
  return useQuizStore((state) => {
    if (!state.quiz) return false;
    const answeredCount = Object.keys(state.answers).length;
    return answeredCount === state.quiz.questions.length;
  });
};

// Export types for component usage
export type { QuizState };
