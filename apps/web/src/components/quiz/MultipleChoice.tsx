'use client';

import { useTranslations } from 'next-intl';

interface MultipleChoiceProps {
  question: Record<string, string>;
  options: string[];
  selectedAnswer?: string;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
  locale: string;
}

export function MultipleChoice({
  question,
  options,
  selectedAnswer,
  onAnswer,
  disabled = false,
  locale,
}: MultipleChoiceProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">{question[locale] || question.vi}</h2>
      
      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => !disabled && onAnswer(option)}
            disabled={disabled}
            className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-colors ${
              selectedAnswer === option
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
          </button>
        ))}
      </div>
    </div>
  );
}
