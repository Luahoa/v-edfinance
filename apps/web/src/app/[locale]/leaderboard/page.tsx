'use client';

import { api } from '@/lib/api-client';
import { Flame, Target, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import Image from 'next/image';

export default function LeaderboardPage() {
  const t = useTranslations('Leaderboard');
  const [activeTab, setActiveTab] = useState<'points' | 'streaks'>('points');
  const [data, setData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get<unknown[]>(`/leaderboard/${activeTab}`);
        setData(response);
      } catch (error) {
        console.error('Failed to fetch leaderboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Trophy className="text-yellow-500" /> {t('title')}
        </h1>
      </div>

      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-lg border border-zinc-200 p-1 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('points')}
            className={`px-4 py-2 rounded-md transition-all ${
              activeTab === 'points'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {t('points')}
          </button>
          <button
            onClick={() => setActiveTab('streaks')}
            className={`px-4 py-2 rounded-md transition-all ${
              activeTab === 'streaks'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {t('streaks')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">
                {t('rank')}
              </th>
              <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">
                {t('user')}
              </th>
              <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 text-right">
                {t('value')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                        <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-700 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              : data.map((it, index) => {
                  const item = it as {
                    id?: string;
                    userId: string;
                    avatar?: string;
                    displayName: string;
                    points: number;
                    longestStreak: number;
                  };
                  return (
                    <tr
                      key={item.id || item.userId}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">
                        {index === 0 ? (
                          <span className="text-2xl">🥇</span>
                        ) : index === 1 ? (
                          <span className="text-2xl">🥈</span>
                        ) : index === 2 ? (
                          <span className="text-2xl">🥉</span>
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold border-2 border-white dark:border-zinc-800 shadow-sm relative overflow-hidden">
                            {item.avatar ? (
                              <Image
                                src={item.avatar}
                                alt={item.displayName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              item.displayName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {item.displayName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {activeTab === 'points' ? (
                          <div className="flex items-center justify-end gap-1.5 font-bold text-blue-600">
                            <Target size={16} />
                            {item.points.toLocaleString()}{' '}
                            <span className="text-xs font-normal text-zinc-500 lowercase">
                              {t('pointsSuffix')}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 font-bold text-orange-500">
                            <Flame size={16} />
                            {item.longestStreak}{' '}
                            <span className="text-xs font-normal text-zinc-500 lowercase">
                              {t('daysSuffix')}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
