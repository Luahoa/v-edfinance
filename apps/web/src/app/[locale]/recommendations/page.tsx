'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface CourseRecommendation {
  courseId: string;
  title: string;
  matchScore: number;
  reason: string;
  reasoning: string;
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/recommendations/courses?userId=temp-user&limit=6');
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Recommendations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReasonColor = (reason: string) => {
    const colors = {
      similar_learners: 'from-blue-500 to-cyan-500',
      trending: 'from-pink-500 to-rose-500',
      skill_gap: 'from-amber-500 to-orange-500',
      streak_booster: 'from-green-500 to-emerald-500',
    };
    return colors[reason] || 'from-gray-500 to-gray-600';
  };

  const getReasonLabel = (reason: string) => {
    const labels = {
      similar_learners: '🎯 Phù hợp với bạn',
      trending: '🔥 Đang hot',
      skill_gap: '📚 Bổ sung kỹ năng',
      streak_booster: '⚡ Duy trì streak',
    };
    return labels[reason] || 'Gợi ý';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Khóa Học Dành Cho Bạn</h1>
          <p className="text-gray-600">AI đã chọn lọc những khóa học phù hợp nhất</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <div
              key={rec.courseId}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:scale-105"
            >
              <div className={`h-2 bg-gradient-to-r ${getReasonColor(rec.reason)}`} />
              <div className="p-6">
                <div className="mb-3">
                  <span className="text-xs font-semibold text-gray-500">
                    {getReasonLabel(rec.reason)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{rec.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{rec.reasoning}</p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Match: <span className="font-semibold text-cyan-600">{rec.matchScore.toFixed(0)}%</span>
                  </div>
                  <Link
                    href={`/courses/${rec.courseId}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all text-sm font-semibold"
                  >
                    Xem ngay <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
