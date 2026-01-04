'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface QuestionFormData {
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'MATCHING';
  question: { vi: string; en: string; zh: string };
  options?: string[];
  correctAnswer: any;
  points: number;
  order: number;
}

interface QuizFormData {
  lessonId: string;
  title: { vi: string; en: string; zh: string };
  description?: { vi: string; en: string; zh: string };
  published: boolean;
  questions: QuestionFormData[];
}

export function QuizBuilderForm({ lessonId, quizId }: { lessonId: string; quizId?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<QuizFormData>({
    lessonId,
    title: { vi: '', en: '', zh: '' },
    description: { vi: '', en: '', zh: '' },
    published: false,
    questions: [],
  });

  const [currentLang, setCurrentLang] = useState<'vi' | 'en' | 'zh'>('vi');

  // Add new question
  const addQuestion = (type: QuestionFormData['type']) => {
    const newQuestion: QuestionFormData = {
      type,
      question: { vi: '', en: '', zh: '' },
      correctAnswer: type === 'TRUE_FALSE' ? true : '',
      points: 1,
      order: formData.questions.length,
    };

    if (type === 'MULTIPLE_CHOICE') {
      newQuestion.options = ['', '', '', ''];
    }

    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion],
    });
  };

  // Update question
  const updateQuestion = (index: number, updates: Partial<QuestionFormData>) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    setFormData({ ...formData, questions: updatedQuestions });
  };

  // Remove question
  const removeQuestion = (index: number) => {
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: updatedQuestions });
  };

  // Submit quiz
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(
        quizId ? `${apiUrl}/quiz/${quizId}` : `${apiUrl}/quiz`,
        {
          method: quizId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save quiz');
      }

      router.push(`/teacher/lessons/${lessonId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save quiz');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {quizId ? 'Edit Quiz' : 'Create Quiz'}
          </h1>
          <p className="text-gray-600">Build your quiz with multiple question types</p>
        </div>

        {/* Language Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {(['vi', 'en', 'zh'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setCurrentLang(lang)}
              className={`px-4 py-2 font-medium transition-colors ${
                currentLang === lang
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Quiz Info */}
        <div className="space-y-4 bg-gray-50 p-6 rounded-lg dark:bg-gray-800">
          <div>
            <label className="block text-sm font-medium mb-2">
              Title ({currentLang.toUpperCase()})
            </label>
            <input
              type="text"
              value={formData.title[currentLang]}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  title: { ...formData.title, [currentLang]: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description ({currentLang.toUpperCase()}) - Optional
            </label>
            <textarea
              value={formData.description?.[currentLang] || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: {
                    ...formData.description,
                    [currentLang]: e.target.value,
                  },
                })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>

        {/* Questions */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Questions</h2>

          {formData.questions.map((question, index) => (
            <div
              key={index}
              className="mb-6 p-6 border-2 border-gray-200 rounded-lg dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Question {index + 1} - {question.type}
                </h3>
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>

              {/* Question Text */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Question ({currentLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={question.question[currentLang]}
                  onChange={(e) =>
                    updateQuestion(index, {
                      question: {
                        ...question.question,
                        [currentLang]: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              {/* Options for Multiple Choice */}
              {question.type === 'MULTIPLE_CHOICE' && question.options && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Options</label>
                  {question.options.map((option, optIndex) => (
                    <input
                      key={optIndex}
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(question.options || [])];
                        newOptions[optIndex] = e.target.value;
                        updateQuestion(index, { options: newOptions });
                      }}
                      placeholder={`Option ${optIndex + 1}`}
                      className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  ))}
                </div>
              )}

              {/* Correct Answer */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Correct Answer</label>
                {question.type === 'TRUE_FALSE' ? (
                  <select
                    value={String(question.correctAnswer)}
                    onChange={(e) =>
                      updateQuestion(index, { correctAnswer: e.target.value === 'true' })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={question.correctAnswer}
                    onChange={(e) =>
                      updateQuestion(index, { correctAnswer: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                )}
              </div>

              {/* Points */}
              <div>
                <label className="block text-sm font-medium mb-2">Points</label>
                <input
                  type="number"
                  min="1"
                  value={question.points}
                  onChange={(e) =>
                    updateQuestion(index, { points: parseInt(e.target.value) })
                  }
                  className="w-20 px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          ))}

          {/* Add Question Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => addQuestion('MULTIPLE_CHOICE')}
              className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              + Multiple Choice
            </button>
            <button
              type="button"
              onClick={() => addQuestion('TRUE_FALSE')}
              className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              + True/False
            </button>
            <button
              type="button"
              onClick={() => addQuestion('SHORT_ANSWER')}
              className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              + Short Answer
            </button>
            <button
              type="button"
              onClick={() => addQuestion('MATCHING')}
              className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              + Matching
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || formData.questions.length === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : quizId ? 'Update Quiz' : 'Create Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
}
