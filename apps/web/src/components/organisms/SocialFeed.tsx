'use client';

import type { Post } from '@/types';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SocialPostCard } from '../molecules/SocialPostCard';

export const SocialFeed = ({ initialPosts = [] }: { initialPosts?: Post[] }) => {
  const t = useTranslations('Social');
  const [posts, setPosts] = useState(initialPosts);

  useEffect(() => {
    // In a real scenario, use environment variable for API URL
    const socket = io('http://localhost:3001/social', {
      transports: ['websocket'],
    });

    socket.on('new_post', (newPost) => {
      setPosts((prev) => [newPost, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (posts.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <p className="text-gray-500 text-sm">{t('emptyFeed')}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-6 bg-blue-600 rounded-full" />
        {t('feed')}
      </h3>
      <div className="space-y-4">
        {posts.map((post) => (
          <SocialPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};
