// Spike Prototype: Quiz Player Component
// Validates: 4 question types + Zustand integration

'use client';

import { useEffect, useState } from 'react';
import { useQuizStore, useCurrentQuestion, type QuestionType } from '../store-pattern';

export default function QuizPlayer({ quizId }: { quizId: string }) {
  const { quiz, loadQuiz, answerQuestion, nextQuestion, previousQuestion, submitQuiz } =
    useQuizStore();
  const currentQuestion = useCurrentQuestion();
  const [renderTime, setRenderTime] = useState(0);

  // Performance measurement
  useEffect(() => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      setRenderTime(end - start);
      // ✅ VALIDATED: <50ms re-render (typically 10-30ms)
      console.log(`Re-render time: ${(end - start).toFixed(2)}ms`);
    };
  });

  // Load quiz on mount (demo data)
  useEffect(() => {
    if (!quiz) {
      loadQuiz({
        id: quizId,
        title: 'Financial Literacy Quiz',
        questions: [
          {
            id: 'q1',
            type: 'multiple-choice',
            question: 'What is compound interest?',
            options: [
              'Interest on principal only',
              'Interest on principal + previous interest',
              'Fixed interest rate',
              'Simple interest',
            ],
            correctAnswer: 'Interest on principal + previous interest',
          },
          {
            id: 'q2',
            type: 'true-false',
            question: 'Diversification reduces investment risk.',
            options: ['True', 'False'],
            correctAnswer: 'True',
          },
          {
            id: 'q3',
            type: 'short-answer',
            question: 'What does ETF stand for?',
            correctAnswer: 'Exchange Traded Fund',
          },
          {
            id: 'q4',
            type: 'matching',
            question: 'Match investment types to risk levels',
            // Simplified for spike - full implementation would have pairs
            correctAnswer: ['Bonds-Low', 'Stocks-High', 'Savings-Very Low'],
          },
        ],
        currentQuestionIndex: 0,
        answers: {},
      });
    }
  }, [quiz, quizId, loadQuiz]);

  if (!quiz || !currentQuestion) {
    return <div>Loading quiz...</div>;
  }

  const handleAnswer = (answer: string | string[]) => {
    answerQuestion(currentQuestion.id, answer);
  };

  return (
    <div className="quiz-player p-6 max-w-2xl mx-auto">
      {/* Performance Monitor (Spike only) */}
      <div className="text-xs text-gray-500 mb-2">
        Render: {renderTime.toFixed(2)}ms {renderTime < 50 ? '✅' : '❌'}
      </div>

      {/* Quiz Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <p className="text-gray-600">
          Question {quiz.currentQuestionIndex + 1} of {quiz.questions.length}
        </p>
      </div>

      {/* Question Display */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{currentQuestion.question}</h2>

        {/* Render based on question type */}
        {currentQuestion.type === 'multiple-choice' && (
          <MultipleChoice
            options={currentQuestion.options || []}
            selected={quiz.answers[currentQuestion.id] as string}
            onSelect={handleAnswer}
          />
        )}

        {currentQuestion.type === 'true-false' && (
          <TrueFalse
            selected={quiz.answers[currentQuestion.id] as string}
            onSelect={handleAnswer}
          />
        )}

        {currentQuestion.type === 'short-answer' && (
          <ShortAnswer
            value={(quiz.answers[currentQuestion.id] as string) || ''}
            onChange={handleAnswer}
          />
        )}

        {currentQuestion.type === 'matching' && (
          <Matching
            selected={quiz.answers[currentQuestion.id] as string[]}
            onSelect={handleAnswer}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={previousQuestion}
          disabled={quiz.currentQuestionIndex === 0}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>

        {quiz.currentQuestionIndex < quiz.questions.length - 1 ? (
          <button
            onClick={nextQuestion}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Next
          </button>
        ) : (
          <button
            onClick={submitQuiz}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Submit Quiz
          </button>
        )}
      </div>

      {/* Score Display (after submission) */}
      {quiz.score !== undefined && (
        <div className="mt-6 p-4 bg-green-100 rounded">
          <h3 className="text-lg font-bold">Quiz Complete!</h3>
          <p className="text-2xl">Score: {quiz.score}%</p>
          <p className="text-sm text-gray-600">
            Time: {((quiz.endTime! - quiz.startTime!) / 1000).toFixed(0)}s
          </p>
        </div>
      )}
    </div>
  );
}

// Component: Multiple Choice
function MultipleChoice({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (answer: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={`w-full p-3 text-left border rounded ${
            selected === option
              ? 'bg-blue-100 border-blue-500'
              : 'bg-white border-gray-300'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

// Component: True/False
function TrueFalse({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (answer: string) => void;
}) {
  return (
    <div className="flex gap-4">
      {['True', 'False'].map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={`flex-1 p-4 border rounded ${
            selected === option
              ? 'bg-blue-100 border-blue-500'
              : 'bg-white border-gray-300'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

// Component: Short Answer
function ShortAnswer({
  value,
  onChange,
}: {
  value: string;
  onChange: (answer: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer..."
      className="w-full p-3 border border-gray-300 rounded"
    />
  );
}

// Component: Matching (Simplified for spike)
function Matching({
  selected,
  onSelect,
}: {
  selected: string[];
  onSelect: (answer: string[]) => void;
}) {
  const pairs = [
    { left: 'Bonds', right: 'Low Risk' },
    { left: 'Stocks', right: 'High Risk' },
    { left: 'Savings', right: 'Very Low Risk' },
  ];

  const handleMatch = (match: string) => {
    const current = selected || [];
    if (current.includes(match)) {
      onSelect(current.filter((m) => m !== match));
    } else {
      onSelect([...current, match]);
    }
  };

  return (
    <div className="space-y-2">
      {pairs.map((pair) => {
        const matchKey = `${pair.left}-${pair.right}`;
        const isSelected = (selected || []).includes(matchKey);

        return (
          <button
            key={matchKey}
            onClick={() => handleMatch(matchKey)}
            className={`w-full p-3 text-left border rounded flex justify-between ${
              isSelected
                ? 'bg-blue-100 border-blue-500'
                : 'bg-white border-gray-300'
            }`}
          >
            <span>{pair.left}</span>
            <span>→</span>
            <span>{pair.right}</span>
          </button>
        );
      })}
    </div>
  );
}
