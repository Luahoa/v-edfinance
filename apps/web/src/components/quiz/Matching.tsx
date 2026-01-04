'use client';

import { useState } from 'react';

interface MatchingPair {
  left: string;
  right: string;
}

interface MatchingProps {
  question: Record<string, string>;
  pairs: MatchingPair[];
  answers?: Record<string, string>;
  onAnswer: (answers: Record<string, string>) => void;
  disabled?: boolean;
  locale: string;
}

export function Matching({
  question,
  pairs,
  answers = {},
  onAnswer,
  disabled = false,
  locale,
}: MatchingProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>(answers);

  const handleLeftClick = (leftItem: string) => {
    if (disabled) return;
    setSelectedLeft(leftItem === selectedLeft ? null : leftItem);
  };

  const handleRightClick = (rightItem: string) => {
    if (disabled || !selectedLeft) return;

    const newMatches = {
      ...matches,
      [selectedLeft]: rightItem,
    };

    setMatches(newMatches);
    onAnswer(newMatches);
    setSelectedLeft(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">{question[locale] || question.vi}</h2>
      
      <p className="text-sm text-gray-600 mb-4">
        Click an item on the left, then click its match on the right
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-2">
          <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Items</p>
          {pairs.map((pair, index) => {
            const matchKey = pair.left;
            const isSelected = selectedLeft === matchKey;
            const isMatched = !!matches[matchKey];

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleLeftClick(matchKey)}
                disabled={disabled}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : isMatched
                    ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="flex justify-between items-center">
                  <span>{pair.left}</span>
                  {isMatched && <span className="text-green-600">→</span>}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="space-y-2">
          <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Matches</p>
          {pairs.map((pair, index) => {
            const rightItem = pair.right;
            const isMatched = Object.values(matches).includes(rightItem);

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleRightClick(rightItem)}
                disabled={disabled || !selectedLeft}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  isMatched
                    ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                    : selectedLeft
                    ? 'border-gray-300 hover:border-blue-400 dark:border-gray-600'
                    : 'border-gray-200 dark:border-gray-700'
                } ${
                  disabled || !selectedLeft
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                {rightItem}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
