'use client';

import type { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { enUS, vi, zhCN } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { BuddyAvatar } from '../atoms/BuddyAvatar';

interface SocialPostCardProps {
  post: Post;
}

export const SocialPostCard = ({ post }: SocialPostCardProps) => {
  const t = useTranslations('Social');
  const locale = useLocale();

  const getDateLocale = () => {
    if (locale === 'vi') return vi;
    if (locale === 'zh') return zhCN;
    return enUS;
  };

  const displayName = post.user.metadata?.displayName || post.user.email.split('@')[0];
  const translatedContent = post.content?.[locale] || post.content?.en || '';

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 transition-all hover:shadow-md">
      <div className="flex items-center gap-3 mb-3">
        <BuddyAvatar displayName={displayName} />
        <div>
          <h4 className="font-semibold text-gray-900 leading-tight">{displayName}</h4>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(post.createdAt), {
              addSuffix: true,
              locale: getDateLocale(),
            })}
          </span>
        </div>
        <div className="ml-auto">
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
              post.type === 'ACHIEVEMENT'
                ? 'bg-yellow-100 text-yellow-700'
                : post.type === 'MILESTONE'
                  ? 'bg-green-100 text-green-700'
                  : post.type === 'NUDGE'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
            }`}
          >
            {t(`postTypes.${post.type}`)}
          </span>
        </div>
      </div>
      <p className="text-gray-700 text-sm whitespace-pre-wrap">{translatedContent}</p>
    </div>
  );
};
