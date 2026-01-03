'use client';

import { SocialFeed } from '@/components/organisms/SocialFeed';
import { BuddyRecommendations } from '@/components/molecules/BuddyRecommendations';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Users } from 'lucide-react';
import type { Post as SocialPostType, BuddyGroup } from '@/types';

export default function SocialPage() {
  const t = useTranslations('Social');
  const { token } = useAuthStore();
  const [feedPosts, setFeedPosts] = useState<SocialPostType[]>([]);
  const [recommendations, setRecommendations] = useState<BuddyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      try {
        const [feedRes, recsRes] = await Promise.all([
          fetch(`${API_URL}/social/feed?limit=10`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/social/recommendations`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (feedRes.ok) setFeedPosts(await feedRes.json());
        if (recsRes.ok) setRecommendations(await recsRes.json());
      } catch (err) {
        console.error('Fetch social data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <div className="h-9 w-48 mb-8 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
            ))}
          </div>
          <div className="lg:col-span-1 space-y-4">
            <div className="h-64 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Users className="text-amber-600" />
        {t('feed')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SocialFeed initialPosts={feedPosts} />
        </div>
        <div className="lg:col-span-1">
          <BuddyRecommendations recommendations={recommendations} />
        </div>
      </div>
    </div>
  );
}
