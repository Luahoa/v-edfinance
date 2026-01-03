'use client';

import { AlertTriangle, FileSearch, Upload } from 'lucide-react';
import { useState } from 'react';

interface DocumentInsight {
  summary: string;
  keyTerms: Array<{ term: string; explanation: string }>;
  suggestedLessons: string[];
  riskFlags: string[];
  spendingBreakdown?: Array<{
    category: string;
    percentage: number;
    amount: number;
  }>;
}

export default function DocumentAnalyzerPage() {
  const [insight, setInsight] = useState<DocumentInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [documentText, setDocumentText] = useState('');

  const analyzeDocument = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/document-analyzer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText,
          documentType: 'bank_statement',
        }),
      });
      const data = await response.json();
      setInsight(data);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 mb-4">
            <FileSearch className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Phân Tích Tài Liệu Tài Chính</h1>
          <p className="text-gray-600">AI giúp bạn hiểu rõ tài liệu trong vài giây</p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dán nội dung tài liệu (sao kê ngân hàng, hóa đơn, hợp đồng...)
            </label>
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Ví dụ: Ngày 01/01 - Chuyển khoản -500,000 VND..."
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            onClick={analyzeDocument}
            disabled={loading || !documentText}
            className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            {loading ? 'Đang phân tích...' : 'Phân tích ngay'}
          </button>
        </div>

        {/* Results */}
        {insight && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-lg mb-3">Tóm tắt</h3>
              <p className="text-gray-700">{insight.summary}</p>
            </div>

            {/* Risk Flags */}
            {insight.riskFlags.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <h3 className="font-semibold text-lg text-red-800">Cảnh báo</h3>
                </div>
                <ul className="space-y-2">
                  {insight.riskFlags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-red-700">
                      <span>•</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Terms */}
            {insight.keyTerms.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Thuật ngữ quan trọng</h3>
                <div className="space-y-3">
                  {insight.keyTerms.map((term, idx) => (
                    <div key={idx} className="p-3 bg-teal-50 rounded-lg">
                      <div className="font-semibold text-teal-800">{term.term}</div>
                      <div className="text-sm text-gray-600 mt-1">{term.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Spending Breakdown */}
            {insight.spendingBreakdown && insight.spendingBreakdown.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Phân tích chi tiêu</h3>
                <div className="space-y-3">
                  {insight.spendingBreakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: `hsl(${idx * 60}, 70%, 50%)`,
                          }}
                        />
                        <span className="font-medium">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{item.amount.toLocaleString('vi-VN')} ₫</div>
                        <div className="text-sm text-gray-500">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Lessons */}
            {insight.suggestedLessons.length > 0 && (
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-lg p-6 text-white">
                <h3 className="font-semibold text-lg mb-3">Khóa học gợi ý dành cho bạn</h3>
                <ul className="space-y-2">
                  {insight.suggestedLessons.map((lesson, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span>📚</span>
                      <span>{lesson}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
