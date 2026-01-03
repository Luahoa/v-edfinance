'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Play, Target, TrendingUp, Users, BookOpen, Award, MessageCircle, Sparkles, Brain, TrendingDown, FileSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useAnalytics } from '@/hooks/useAnalytics';

const quickActions = [
  { 
    icon: Play, 
    labelKey: 'continueLearning',
    href: '/courses',
    action: 'CONTINUE_LEARNING',
    gradient: 'from-amber-500 to-orange-500',
    hoverGradient: 'hover:from-amber-400 hover:to-orange-400',
  },
  { 
    icon: Target, 
    labelKey: 'dailyChallenge',
    href: '/simulation',
    action: 'DAILY_CHALLENGE',
    gradient: 'from-purple-500 to-pink-500',
    hoverGradient: 'hover:from-purple-400 hover:to-pink-400',
  },
  { 
    icon: MessageCircle, 
    labelKey: 'askAiTutor',
    href: '/ai-tutor',
    action: 'AI_CHAT',
    gradient: 'from-violet-500 to-purple-500',
    hoverGradient: 'hover:from-violet-400 hover:to-purple-400',
    badge: 'AI',
  },
  { 
    icon: Sparkles, 
    labelKey: 'recommendedCourses',
    href: '/recommendations',
    action: 'AI_RECOMMENDATIONS',
    gradient: 'from-cyan-500 to-blue-500',
    hoverGradient: 'hover:from-cyan-400 hover:to-blue-400',
    badge: 'AI',
  },
  { 
    icon: Brain, 
    labelKey: 'predictSuccess',
    href: '/prediction',
    action: 'PREDICT_SUCCESS',
    gradient: 'from-indigo-500 to-purple-500',
    hoverGradient: 'hover:from-indigo-400 hover:to-purple-400',
    badge: 'AI',
  },
  { 
    icon: TrendingUp, 
    labelKey: 'marketSimulator',
    href: '/market-simulator',
    action: 'MARKET_SIMULATOR',
    gradient: 'from-green-500 to-emerald-500',
    hoverGradient: 'hover:from-green-400 hover:to-emerald-400',
  },
  { 
    icon: FileSearch, 
    labelKey: 'analyzeDocument',
    href: '/document-analyzer',
    action: 'ANALYZE_DOCUMENT',
    gradient: 'from-teal-500 to-cyan-500',
    hoverGradient: 'hover:from-teal-400 hover:to-cyan-400',
    badge: 'AI',
  },
  { 
    icon: Users, 
    labelKey: 'studyGroup',
    href: '/social',
    action: 'STUDY_GROUP',
    gradient: 'from-blue-500 to-cyan-500',
    hoverGradient: 'hover:from-blue-400 hover:to-cyan-400',
  },
  { 
    icon: BookOpen, 
    labelKey: 'browseCourses',
    href: '/courses',
    action: 'BROWSE_COURSES',
    gradient: 'from-pink-500 to-rose-500',
    hoverGradient: 'hover:from-pink-400 hover:to-rose-400',
  },
];

export function QuickActionsGrid() {
  const t = useTranslations('Dashboard');
  const { trackEvent } = useAnalytics();

  const handleActionClick = (action: string, href: string) => {
    trackEvent(action, 'QUICK_ACTION', { destination: href });
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        {t('quickActions')}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;

          return (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link 
                href={action.href}
                onClick={() => handleActionClick(action.action, action.href)}
              >
                <div
                  className={cn(
                    'group relative p-6 rounded-xl transition-all duration-300',
                    'bg-white dark:bg-slate-800/50 backdrop-blur-sm',
                    'border border-zinc-200 dark:border-slate-700/50',
                    'hover:scale-105 hover:shadow-xl cursor-pointer',
                    'hover:border-blue-500 dark:hover:border-slate-600'
                  )}
                >
                {/* Gradient Background on Hover */}
                <div
                  className={cn(
                    'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity',
                    'bg-gradient-to-br',
                    action.gradient
                  )}
                />

                {/* Icon */}
                <div
                  className={cn(
                    'w-12 h-12 mb-4 rounded-lg flex items-center justify-center relative',
                    'bg-gradient-to-br',
                    action.gradient,
                    action.hoverGradient,
                    'transition-all duration-300'
                  )}
                >
                  <Icon className="w-6 h-6 text-white" />
                  {action.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {action.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <h3 className="font-semibold text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  {t(action.labelKey)}
                </h3>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
    </div>
  );
}
