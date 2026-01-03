'use client';

import Button from '@/components/atoms/Button';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface AdminLessonFormProps {
  courseId: string;
  initialData?: {
    id?: string;
    title: Record<string, string>;
    content: Record<string, string>;
    type: 'VIDEO' | 'TEXT';
    videoType?: 'FILE' | 'YOUTUBE';
    youtubeUrl?: string;
    order: number;
  };
  onSubmit: (data: {
    courseId: string;
    title: Record<string, string>;
    content: Record<string, string>;
    type: string;
    videoType?: string;
    youtubeUrl?: string;
    order: number;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function AdminLessonForm({
  courseId,
  initialData,
  onSubmit,
  onCancel,
}: AdminLessonFormProps) {
  const t = useTranslations('Admin');
  const [loading, setLoading] = useState(false);
  const [youtubeValidating, setYoutubeValidating] = useState(false);
  const [youtubeMetadata, setYoutubeMetadata] = useState<{
    title?: string;
    duration?: number;
    thumbnailUrl?: string;
    valid?: boolean;
    error?: string;
  }>({});

  const [formData, setFormData] = useState({
    title: {
      vi: initialData?.title?.vi || '',
      en: initialData?.title?.en || '',
      zh: initialData?.title?.zh || '',
    },
    content: {
      vi: initialData?.content?.vi || '',
      en: initialData?.content?.en || '',
      zh: initialData?.content?.zh || '',
    },
    type: initialData?.type || 'VIDEO',
    videoType: initialData?.videoType || 'FILE',
    youtubeUrl: initialData?.youtubeUrl || '',
    order: initialData?.order || 1,
  });

  const parseYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
      /^yt:([a-zA-Z0-9_-]+)$/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const validateYouTubeUrl = async (url: string) => {
    if (!url.trim()) {
      setYoutubeMetadata({});
      return;
    }

    const videoId = parseYouTubeVideoId(url);
    if (!videoId) {
      setYoutubeMetadata({
        valid: false,
        error: 'Invalid YouTube URL format',
      });
      return;
    }

    setYoutubeValidating(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/youtube/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const data = await response.json();
        setYoutubeMetadata({
          valid: true,
          title: data.title,
          duration: data.duration,
          thumbnailUrl: data.thumbnailUrl,
        });
      } else {
        setYoutubeMetadata({
          valid: false,
          error: 'Failed to validate YouTube video',
        });
      }
    } catch (error) {
      setYoutubeMetadata({
        valid: false,
        error: 'Network error while validating YouTube URL',
      });
    } finally {
      setYoutubeValidating(false);
    }
  };

  const handleYouTubeUrlChange = (url: string) => {
    setFormData({ ...formData, youtubeUrl: url });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        courseId,
        ...formData,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type Selection */}
      <div>
        <label htmlFor="lesson-type" className="mb-2 block text-sm font-medium">
          Lesson Type
        </label>
        <select
          id="lesson-type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as 'VIDEO' | 'TEXT' })}
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="VIDEO">Video</option>
          <option value="TEXT">Text</option>
        </select>
      </div>

      {/* Video Type Selection */}
      {formData.type === 'VIDEO' && (
        <div>
          <label htmlFor="video-source" className="mb-2 block text-sm font-medium">
            Video Source
          </label>
          <select
            id="video-source"
            value={formData.videoType}
            onChange={(e) =>
              setFormData({
                ...formData,
                videoType: e.target.value as 'FILE' | 'YOUTUBE',
              })
            }
            className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="FILE">Uploaded File</option>
            <option value="YOUTUBE">YouTube</option>
          </select>
        </div>
      )}

      {/* YouTube URL Input */}
      {formData.type === 'VIDEO' && formData.videoType === 'YOUTUBE' && (
        <div>
          <label htmlFor="youtube-url" className="mb-2 block text-sm font-medium">
            YouTube URL
          </label>
          <div className="flex gap-2">
            <input
              id="youtube-url"
              type="text"
              value={formData.youtubeUrl}
              onChange={(e) => handleYouTubeUrlChange(e.target.value)}
              onBlur={() => validateYouTubeUrl(formData.youtubeUrl)}
              placeholder="https://youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            {youtubeValidating && <Loader2 className="h-6 w-6 animate-spin" />}
          </div>

          {/* YouTube Validation Feedback */}
          {youtubeMetadata.valid === true && (
            <div className="mt-2 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                ✓ Valid YouTube video
              </p>
              {youtubeMetadata.title && (
                <p className="text-sm text-green-700 dark:text-green-500">
                  Title: {youtubeMetadata.title}
                </p>
              )}
              {youtubeMetadata.duration && (
                <p className="text-sm text-green-700 dark:text-green-500">
                  Duration: {Math.floor(youtubeMetadata.duration / 60)}m{' '}
                  {youtubeMetadata.duration % 60}s
                </p>
              )}
            </div>
          )}

          {youtubeMetadata.valid === false && (
            <div className="mt-2 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-800 dark:text-red-400">
                ✗ {youtubeMetadata.error}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Title Fields (i18n) */}
      <div>
        <label htmlFor="title-vi" className="mb-2 block text-sm font-medium">
          Title (Vietnamese)
        </label>
        <input
          id="title-vi"
          type="text"
          value={formData.title.vi}
          onChange={(e) =>
            setFormData({
              ...formData,
              title: { ...formData.title, vi: e.target.value },
            })
          }
          required
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="title-en" className="mb-2 block text-sm font-medium">
          Title (English)
        </label>
        <input
          id="title-en"
          type="text"
          value={formData.title.en}
          onChange={(e) =>
            setFormData({
              ...formData,
              title: { ...formData.title, en: e.target.value },
            })
          }
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="title-zh" className="mb-2 block text-sm font-medium">
          Title (Chinese)
        </label>
        <input
          id="title-zh"
          type="text"
          value={formData.title.zh}
          onChange={(e) =>
            setFormData({
              ...formData,
              title: { ...formData.title, zh: e.target.value },
            })
          }
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {/* Content Fields (i18n) */}
      <div>
        <label htmlFor="content-vi" className="mb-2 block text-sm font-medium">
          Content (Vietnamese)
        </label>
        <textarea
          id="content-vi"
          value={formData.content.vi}
          onChange={(e) =>
            setFormData({
              ...formData,
              content: { ...formData.content, vi: e.target.value },
            })
          }
          rows={6}
          required
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {/* Order */}
      <div>
        <label htmlFor="lesson-order" className="mb-2 block text-sm font-medium">
          Lesson Order
        </label>
        <input
          id="lesson-order"
          type="number"
          value={formData.order}
          onChange={(e) => setFormData({ ...formData, order: Number.parseInt(e.target.value) })}
          min={1}
          required
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button type="submit" isLoading={loading} className="flex-1">
          {initialData?.id ? 'Update Lesson' : 'Create Lesson'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
