'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Star, Trophy, X, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: {
    name: string;
    description: string;
    points?: number;
    type: 'BADGE' | 'STREAK' | 'MILESTONE';
  };
}

export const AchievementModal = ({ isOpen, onClose, achievement }: AchievementModalProps) => {
  const t = useTranslations('Gamification');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden bg-white dark:bg-gray-900 rounded-3xl shadow-2xl"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-yellow-400 to-orange-500 opacity-20" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="relative p-8 text-center">
              <motion.div
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                className="inline-flex items-center justify-center w-24 h-24 mb-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full"
              >
                {achievement.type === 'STREAK' ? (
                  <Zap className="text-orange-500" size={48} fill="currentColor" />
                ) : (
                  <Trophy className="text-yellow-600 dark:text-yellow-500" size={48} />
                )}
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('achievementUnlocked')}
              </h2>

              <h3 className="text-xl font-semibold text-yellow-600 dark:text-yellow-500 mb-4">
                {achievement.name}
              </h3>

              <p className="text-gray-600 dark:text-gray-400 mb-6">{achievement.description}</p>

              {achievement.points && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-bold mb-8">
                  <Star size={18} fill="currentColor" />
                  {t('pointsEarned', { points: achievement.points })}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  {t('close')}
                </button>
                <button className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium">
                  {t('viewAllAchievements')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
