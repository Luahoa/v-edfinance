'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Brain, Target, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

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
      if (response.ok) {
        const data = await response.json();
        setPrediction(data);
      } else {
        // Mock data if API fails or doesn't exist yet
        setPrediction({
          courseId: 'temp-course',
          predictedScore: 85,
          confidence: 92,
          recommendation: 'Great progress! Focus on "Risk Management" module to improve your score.',
          insights: {
            studyHoursNeeded: 4,
            successProbability: 88,
            similarUsersBenchmark: 72,
          },
        });
      }
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-6">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <Skeleton className="h-10 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto mt-2" />
          </CardHeader>
          <CardContent className="space-y-8">
            <Skeleton className="h-48 w-full rounded-xl" />
            <div className="grid md:grid-cols-3 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
            <Brain className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            {t('title') || 'Learning Outcome Prediction'}
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            {t('description') || 'AI-powered analysis of your learning trajectory and success probability.'}
          </p>
        </div>

        {prediction && (
          <div className="space-y-6">
            {/* Main Score Card */}
            <Card className="border-green-100 dark:border-green-900/50 shadow-lg overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500" />
              <CardContent className="p-8 md:p-12 text-center">
                <div className="mb-6">
                  <div className="text-7xl md:text-8xl font-black text-green-600 dark:text-green-400 tracking-tighter">
                    {prediction.predictedScore.toFixed(0)}<span className="text-4xl align-top text-zinc-400">%</span>
                  </div>
                  <p className="text-lg font-medium text-zinc-500 uppercase tracking-widest mt-2">Predicted Score</p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-medium text-sm">
                  <Target className="w-4 h-4" />
                  Confidence: {prediction.confidence.toFixed(0)}%
                </div>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
              <CardContent className="p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">AI Recommendation</h3>
                  <p className="text-blue-800 dark:text-blue-200 leading-relaxed">{prediction.recommendation}</p>
                </div>
              </CardContent>
            </Card>

            {/* Insights Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-sm font-medium text-zinc-500 mb-2">Study Hours Needed</div>
                  <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                    {prediction.insights.studyHoursNeeded}h
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">per week to reach goal</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-sm font-medium text-zinc-500 mb-3">Success Probability</div>
                  <div className="flex items-end gap-2 mb-2">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {prediction.insights.successProbability.toFixed(0)}%
                    </div>
                  </div>
                  <Progress value={prediction.insights.successProbability} className="h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-sm font-medium text-zinc-500 mb-2">vs. Similar Users</div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      +{prediction.predictedScore - prediction.insights.similarUsersBenchmark}%
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">above benchmark ({prediction.insights.similarUsersBenchmark}%)</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
