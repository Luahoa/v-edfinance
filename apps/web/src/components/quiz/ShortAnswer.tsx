'use client';

import { useState } from 'react';

interface ShortAnswerProps {
  question: Record<string, string>;
  answer?: string;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
  locale: string;
}

export function ShortAnswer({
  question,
  answer = '',
  onAnswer,
  disabled = false,
  locale,
}: ShortAnswerProps) {
  const [value, setValue] = useState(answer);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onAnswer(newValue);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">{question[locale] || question.vi}</h2>
      
      <input
        type="text"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Type your answer..."
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      
      <p className="text-sm text-gray-500">
        Your answer will be checked case-insensitively
      </p>
    </div>
  );
}
