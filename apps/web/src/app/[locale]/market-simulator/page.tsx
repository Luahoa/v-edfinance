'use client';

import { Play, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface SimulationResult {
  scenarioTitle: string;
  description: string;
  initialBudget: number;
  finalBudget: number;
  returnPercentage: number;
  decisions: Array<{
    week: number;
    event: string;
    decision: string;
    impact: number;
  }>;
  lessons: string[];
  leaderboardScore: number;
}

export default function MarketSimulatorPage() {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({
    startingBudget: 10000000,
    riskTolerance: 'medium' as 'low' | 'medium' | 'high',
    duration: '6months' as '1month' | '6months' | '1year',
  });

  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/market-simulator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Mô Phỏng Thị Trường</h1>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ngân sách ban đầu (₫)
              </label>
              <input
                type="number"
                value={params.startingBudget}
                onChange={(e) =>
                  setParams({ ...params, startingBudget: Number.parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mức độ rủi ro
              </label>
              <select
                value={params.riskTolerance}
                onChange={(e) =>
                  setParams({
                    ...params,
                    riskTolerance: e.target.value as 'low' | 'medium' | 'high',
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Thời gian</label>
              <select
                value={params.duration}
                onChange={(e) =>
                  setParams({
                    ...params,
                    duration: e.target.value as '1month' | '6months' | '1year',
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="1month">1 tháng</option>
                <option value="6months">6 tháng</option>
                <option value="1year">1 năm</option>
              </select>
            </div>
          </div>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            {loading ? 'Đang mô phỏng...' : 'Bắt đầu mô phỏng'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-4">{result.scenarioTitle}</h2>
              <p className="text-gray-600 mb-6">{result.description}</p>

              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Ngân sách đầu</div>
                  <div className="text-xl font-bold">
                    {result.initialBudget.toLocaleString('vi-VN')} ₫
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Ngân sách cuối</div>
                  <div className="text-xl font-bold">
                    {result.finalBudget.toLocaleString('vi-VN')} ₫
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Lợi nhuận</div>
                  <div
                    className={`text-xl font-bold flex items-center justify-center gap-1 ${result.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {result.returnPercentage >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    {result.returnPercentage.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg text-white">
                  <div className="text-sm mb-1">Điểm số</div>
                  <div className="text-xl font-bold">{result.leaderboardScore}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Bài học rút ra:</h3>
                {result.lessons.map((lesson, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <span className="text-green-600 font-bold">{idx + 1}.</span>
                    <span className="text-gray-700">{lesson}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
