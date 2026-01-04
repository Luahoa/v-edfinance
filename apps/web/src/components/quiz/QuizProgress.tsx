'use client';

interface QuizProgressProps {
  current: number;
  total: number;
  percentage?: number;
}

export function QuizProgress({ current, total, percentage }: QuizProgressProps) {
  const progress = percentage ?? Math.round((current / total) * 100);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Question {current + 1} of {total}
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {progress}% Complete
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
