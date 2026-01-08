// Spike: Quiz Rendering - Zustand Store Pattern
// Decision: Custom implementation with Zustand state management

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Question Types
export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | 'matching';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple-choice
  correctAnswer?: string | string[];
  userAnswer?: string | string[];
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
  startTime?: number;
  endTime?: number;
  score?: number;
}

interface QuizState {
  // State
  quiz: Quiz | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadQuiz: (quiz: Quiz) => void;
  answerQuestion: (questionId: string, answer: string | string[]) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  submitQuiz: () => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      // Initial State
      quiz: null,
      isLoading: false,
      error: null,

      // Load Quiz
      loadQuiz: (quiz: Quiz) => {
        set({
          quiz: {
            ...quiz,
            currentQuestionIndex: 0,
            answers: {},
            startTime: Date.now(),
          },
          isLoading: false,
          error: null,
        });
      },

      // Answer Question
      answerQuestion: (questionId: string, answer: string | string[]) => {
        const { quiz } = get();
        if (!quiz) return;

        set({
          quiz: {
            ...quiz,
            answers: {
              ...quiz.answers,
              [questionId]: answer,
            },
          },
        });
      },

      // Next Question
      nextQuestion: () => {
        const { quiz } = get();
        if (!quiz) return;

        const nextIndex = Math.min(
          quiz.currentQuestionIndex + 1,
          quiz.questions.length - 1
        );

        set({
          quiz: {
            ...quiz,
            currentQuestionIndex: nextIndex,
          },
        });
      },

      // Previous Question
      previousQuestion: () => {
        const { quiz } = get();
        if (!quiz) return;

        const prevIndex = Math.max(quiz.currentQuestionIndex - 1, 0);

        set({
          quiz: {
            ...quiz,
            currentQuestionIndex: prevIndex,
          },
        });
      },

      // Submit Quiz
      submitQuiz: () => {
        const { quiz } = get();
        if (!quiz) return;

        // Calculate score
        let correct = 0;
        quiz.questions.forEach((question) => {
          const userAnswer = quiz.answers[question.id];
          if (
            JSON.stringify(userAnswer) ===
            JSON.stringify(question.correctAnswer)
          ) {
            correct++;
          }
        });

        const score = Math.round((correct / quiz.questions.length) * 100);

        set({
          quiz: {
            ...quiz,
            endTime: Date.now(),
            score,
          },
        });

        // ⚠️ CRITICAL: Reset store after submission to prevent state leakage
        // This ensures next quiz starts fresh
        setTimeout(() => {
          get().resetQuiz();
        }, 5000); // 5 second delay to show results
      },

      // Reset Quiz (IMPORTANT: Must be called after submission)
      resetQuiz: () => {
        set({
          quiz: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'quiz-storage', // ⚠️ GOTCHA: Must include userId to avoid conflicts
      // Recommended: 'quiz-storage-${userId}'
      partialize: (state) => ({
        // Only persist quiz data, not loading/error states
        quiz: state.quiz,
      }),
    }
  )
);

// Performance Hook: Memoized selector to avoid re-renders
export const useCurrentQuestion = () => {
  const quiz = useQuizStore((state) => state.quiz);
  if (!quiz) return null;
  return quiz.questions[quiz.currentQuestionIndex];
};

// Export type for component usage
export type { QuizState };
