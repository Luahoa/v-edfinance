'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface LessonPlayerProps {
  lesson: {
    id: string;
    title: Record<string, string>;
    content: Record<string, string>;
    videoKey?: Record<string, string> | string;
    type: 'VIDEO' | 'READING' | 'QUIZ';
  };
  locale: string;
  onComplete: () => void;
}

export default function LessonPlayer({ lesson, locale, onComplete }: LessonPlayerProps) {
  const t = useTranslations('lessons');
  const [completed, setCompleted] = useState(false);

  const localizedTitle = lesson.title[locale] || lesson.title.vi;
  const localizedContent = lesson.content[locale] || lesson.content.vi;

  const handleComplete = () => {
    setCompleted(true);
    onComplete();
  };

  return (
    <div className="lesson-player">
      <h1>{localizedTitle}</h1>

      {lesson.type === 'VIDEO' && (
        <video controls onEnded={handleComplete}>
          <source src={getVideoUrl(lesson.videoKey, locale)} type="video/mp4" />
        </video>
      )}

      {lesson.type === 'READING' && (
        <div className="content" dangerouslySetInnerHTML={{ __html: localizedContent }} />
      )}

      {!completed && <button onClick={handleComplete}>{t('markAsComplete')}</button>}
    </div>
  );
}

function getVideoUrl(videoKey: any, locale: string): string {
  if (typeof videoKey === 'string') return `/videos/${videoKey}`;
  return `/videos/${videoKey[locale] || videoKey.vi}`;
}
