'use client';

import type { BuddyGroup } from '@/types';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface BuddyRecommendationsProps {
  recommendations: BuddyGroup[];
}

export const BuddyRecommendations = ({
  recommendations: initialRecommendations,
}: BuddyRecommendationsProps) => {
  const ts = useTranslations('Social');
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleJoin = async (groupId: string) => {
    setLoading(groupId);
    try {
      const res = await fetch('/api/proxy/social/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });

      if (res.ok) {
        // Remove from recommendations after joining
        setRecommendations((prev) => prev.filter((g) => g.id !== groupId));
        router.refresh(); // Refresh dashboard to show new status
      }
    } catch (err) {
      console.error('Join group error:', err);
    } finally {
      setLoading(null);
    }
  };

  if (recommendations.length === 0) return null;

  return (
    <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:from-zinc-900 dark:to-zinc-800 dark:border-zinc-800">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Sparkles className="text-indigo-600" size={20} />
        {ts('recommendations')}
      </h2>
      <div className="space-y-3">
        {recommendations.map((group) => (
          <div
            key={group.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm dark:bg-zinc-800"
          >
            <div>
              <p className="text-sm font-medium">{group.name}</p>
              <p className="text-xs text-zinc-500">
                {ts(`types.${group.type}`)} • {group._count?.members || 0} {ts('members')}
              </p>
            </div>
            <button
              onClick={() => handleJoin(group.id)}
              disabled={loading === group.id}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
            >
              {loading === group.id ? '...' : ts('joinGroup')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
