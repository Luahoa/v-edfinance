'use client';

import { api } from '@/lib/api-client';
import { useGamificationStore } from '@/store/useGamificationStore';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { AchievementModal } from './AchievementModal';

interface ChecklistItem {
  text: string;
  completed: boolean;
  completedAt?: string | null;
}

interface Checklist {
  id: string;
  title: string;
  category: string;
  items: ChecklistItem[];
  progress: number;
}

interface UpdateResponse {
  checklist: Checklist;
  rewarded: boolean;
  message: string;
}

export default function InteractiveChecklist() {
  const t = useTranslations('Checklist');
  const tCommon = useTranslations('Common');
  const { addCelebration, hasCelebrated } = useGamificationStore();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [lastAchievement, setLastAchievement] = useState<{
    name: string;
    description: string;
    points: number;
    type: 'MILESTONE';
  } | null>(null);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Checklist[]>('/checklists');
      setChecklists(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch checklists');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (checklistId: string, itemIndex: number, currentStatus: boolean) => {
    // Optimistic UI Update
    const originalChecklists = [...checklists];
    setChecklists((prev) =>
      prev.map((c) => {
        if (c.id === checklistId) {
          const newItems = [...c.items];
          newItems[itemIndex] = { ...newItems[itemIndex], completed: !currentStatus };
          const completedCount = newItems.filter((i) => i.completed).length;
          const newProgress = Math.round((completedCount / newItems.length) * 100);
          return { ...c, items: newItems, progress: newProgress };
        }
        return c;
      })
    );

    try {
      const data = await api.patch<UpdateResponse>(
        `/checklists/${checklistId}/items/${itemIndex}`,
        {
          completed: !currentStatus,
        }
      );

      setChecklists((prev) => prev.map((c) => (c.id === checklistId ? data.checklist : c)));

      if (data.rewarded && !hasCelebrated(checklistId)) {
        addCelebration(checklistId);
        setLastAchievement({
          name: data.checklist.title,
          description: t('rewardEarned', { title: data.checklist.title }),
          points: 50,
          type: 'MILESTONE',
        });
        setShowAchievement(true);
      }
    } catch (err) {
      // Revert on error
      setChecklists(originalChecklists);
      console.error('Failed to update item:', err);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
        <p className="text-zinc-500 text-sm">{tCommon('loading')}</p>
      </div>
    );

  if (error)
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400">
        <AlertCircle size={20} />
        <div className="flex-1 text-sm">{error}</div>
        <button
          onClick={fetchChecklists}
          className="text-xs font-bold underline uppercase tracking-widest"
        >
          {tCommon('retry')}
        </button>
      </div>
    );

  return (
    <div className="space-y-6">
      {lastAchievement && (
        <AchievementModal
          isOpen={showAchievement}
          onClose={() => setShowAchievement(false)}
          achievement={lastAchievement}
        />
      )}

      {checklists.map((checklist) => (
        <div
          key={checklist.id}
          className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-5 shadow-sm"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-lg">{checklist.title}</h3>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{checklist.category}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-600">{checklist.progress}%</span>
            </div>
          </div>

          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full mb-6 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${checklist.progress}%` }}
              className="h-full bg-blue-600 rounded-full"
            />
          </div>

          <div className="space-y-3">
            {checklist.items.map((item, idx) => (
              <button
                key={idx}
                onClick={() => toggleItem(checklist.id, idx, item.completed)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left group"
              >
                {item.completed ? (
                  <CheckCircle2 className="text-green-500 shrink-0" />
                ) : (
                  <Circle className="text-zinc-300 group-hover:text-blue-400 shrink-0" />
                )}
                <span
                  className={`${item.completed ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-200'} text-sm`}
                >
                  {item.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {checklists.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed rounded-xl text-zinc-400">
          <p>{t('noActiveChecklists')}</p>
        </div>
      )}
    </div>
  );
}
