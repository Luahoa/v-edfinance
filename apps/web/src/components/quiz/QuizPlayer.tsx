'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  useQuizStore,
  useCurrentQuestion,
  useQuizProgress,
  useIsQuizComplete,
} from '@/stores/quizStore';
import { MultipleChoice } from './MultipleChoice';
import { TrueFalse } from './TrueFalse';
import { ShortAnswer } from './ShortAnswer';
import { Matching } from './Matching';
import { QuizProgress } from './QuizProgress';
import { QuizNavigation } from './QuizNavigation';

interface QuizPlayerProps {
  quizId: string;
  userId: string;
}

export function QuizPlayer({ quizId, userId }: QuizPlayerProps) {
  const locale = useLocale();
  const t = useTranslations('Quiz');

  const {
    quiz,
    currentQuestionIndex,
    answers,
    attempt,
    isLoading,
    isSubmitting,
    error,
    fetchQuizForAttempt,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    clearError,
  } = useQuizStore();

  const currentQuestion = useCurrentQuestion();
  const progress = useQuizProgress();
  const isComplete = useIsQuizComplete();

  // Load quiz on mount
  useEffect(() => {
    if (!quiz || quiz.id !== quizId) {
      fetchQuizForAttempt(quizId, userId);
    }
  }, [quizId, userId, quiz, fetchQuizForAttempt]);

  // Handle answer
  const handleAnswer = (questionId: string, answer: any) => {
    answerQuestion(questionId, answer);
  };

  // Handle submit
  const handleSubmit = async () => {
    await submitQuiz(userId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-blue-600 border-r-transparent mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 dark:bg-red-900/20 dark:border-red-800">
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
          Error Loading Quiz
        </h3>
        <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
        <button
          type="button"
          onClick={clearError}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Results state (after submission)
  if (attempt && attempt.completedAt) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center dark:bg-green-900/20 dark:border-green-800">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-2">
          Quiz Complete!
        </h2>
        
        <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Score: {attempt.percentage?.toFixed(0)}%
        </p>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You earned {attempt.score} points out of {quiz?.questions.reduce((sum, q) => sum + q.points, 0)}
        </p>

        <p className="text-sm text-gray-500">
          Redirecting to results in a moment...
        </p>
      </div>
    );
  }

  // No quiz loaded
  if (!quiz || !currentQuestion) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-400">
        No quiz found
      </div>
    );
  }

  // Current user answer
  const currentAnswer = answers[currentQuestion.id];

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
      {/* Quiz Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {quiz.title[locale] || quiz.title.vi}
        </h1>
        {quiz.description && (
          <p className="text-gray-600 dark:text-gray-400">
            {quiz.description[locale] || quiz.description.vi}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <QuizProgress
        current={currentQuestionIndex}
        total={quiz.questions.length}
        percentage={progress}
      />

      {/* Question Renderer */}
      <div className="mb-8">
        {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options && (
          <MultipleChoice
            question={currentQuestion.question}
            options={Array.isArray(currentQuestion.options) 
              ? currentQuestion.options 
              : Object.values(currentQuestion.options)}
            selectedAnswer={currentAnswer}
            onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
            locale={locale}
          />
        )}

        {currentQuestion.type === 'TRUE_FALSE' && (
          <TrueFalse
            question={currentQuestion.question}
            selectedAnswer={currentAnswer}
            onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
            locale={locale}
          />
        )}

        {currentQuestion.type === 'SHORT_ANSWER' && (
          <ShortAnswer
            question={currentQuestion.question}
            answer={currentAnswer}
            onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
            locale={locale}
          />
        )}

        {currentQuestion.type === 'MATCHING' && currentQuestion.options && (
          <Matching
            question={currentQuestion.question}
            pairs={Array.isArray(currentQuestion.options)
              ? currentQuestion.options
              : Object.entries(currentQuestion.options).map(([left, right]) => ({
                  left,
                  right: String(right),
                }))}
            answers={currentAnswer}
            onAnswer={(answers) => handleAnswer(currentQuestion.id, answers)}
            locale={locale}
          />
        )}
      </div>

      {/* Navigation */}
      <QuizNavigation
        currentIndex={currentQuestionIndex}
        totalQuestions={quiz.questions.length}
        onPrevious={previousQuestion}
        onNext={nextQuestion}
        onSubmit={handleSubmit}
        canSubmit={isComplete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
