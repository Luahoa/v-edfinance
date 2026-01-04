'use client';

interface TrueFalseProps {
  question: Record<string, string>;
  selectedAnswer?: boolean;
  onAnswer: (answer: boolean) => void;
  disabled?: boolean;
  locale: string;
}

export function TrueFalse({
  question,
  selectedAnswer,
  onAnswer,
  disabled = false,
  locale,
}: TrueFalseProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-6">{question[locale] || question.vi}</h2>
      
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => !disabled && onAnswer(true)}
          disabled={disabled}
          className={`flex-1 px-8 py-6 rounded-lg border-2 font-semibold transition-colors ${
            selectedAnswer === true
              ? 'border-green-600 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          ✓ True
        </button>
        
        <button
          type="button"
          onClick={() => !disabled && onAnswer(false)}
          disabled={disabled}
          className={`flex-1 px-8 py-6 rounded-lg border-2 font-semibold transition-colors ${
            selectedAnswer === false
              ? 'border-red-600 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          ✗ False
        </button>
      </div>
    </div>
  );
}
