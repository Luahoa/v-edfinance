'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PredictionData {
  courseId: string;
  predictedScore: number;
  confidence: number;
  recommendation: string;
  insights: {
    studyHoursNeeded: number;
    successProbability: number;
    similarUsersBenchmark: number;
  };
}

export default function PredictionPage() {
  const t = useTranslations('prediction');
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrediction();
  }, []);

  const fetchPrediction = async () => {
    try {
      const response = await fetch(
        '/api/prediction/course-outcome?userId=temp-user&courseId=temp-course',
      );
      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Dự Đoán Kết Quả Học Tập
          </h1>
          <p className="text-gray-600">AI phân tích và dự báo thành tích của bạn</p>
        </div>

        {prediction && (
          <div className="space-y-6">
            {/* Score Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="mb-4">
                <div className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {prediction.predictedScore.toFixed(0)}%
                </div>
                <p className="text-gray-500 mt-2">Điểm dự đoán</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                Độ tin cậy: {prediction.confidence.toFixed(0)}%
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Gợi ý cho bạn</h3>
                  <p>{prediction.recommendation}</p>
                </div>
              </div>
            </div>

            {/* Insights Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow p-6">
                <div className="text-sm text-gray-500 mb-2">Cần học thêm</div>
                <div className="text-3xl font-bold text-indigo-600">
                  {prediction.insights.studyHoursNeeded}h
                </div>
                <div className="text-xs text-gray-400 mt-1">mỗi tuần</div>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <div className="text-sm text-gray-500 mb-2">Xác suất thành công</div>
                <div className="text-3xl font-bold text-green-600">
                  {prediction.insights.successProbability.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-400 mt-1">nếu theo kế hoạch</div>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <div className="text-sm text-gray-500 mb-2">So với nhóm</div>
                <div className="text-3xl font-bold text-purple-600">
                  {prediction.insights.similarUsersBenchmark}%
                </div>
                <div className="text-xs text-gray-400 mt-1">điểm trung bình</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
