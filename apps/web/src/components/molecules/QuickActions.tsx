'use client';

import { Play, MessageSquare, Target, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function QuickActions() {
  const t = useTranslations('Dashboard');
  const { trackEvent } = useAnalytics();

  const actions = [
    {
      icon: <Play className="text-blue-600" size={20} />,
      label: t('continueLearning'),
      href: '/courses',
      category: 'COURSE',
    },
    {
      icon: <Target className="text-green-600" size={20} />,
      label: t('setGoal'),
      href: '/simulation/life',
      category: 'SIMULATION',
    },
    {
      icon: <Wallet className="text-amber-600" size={20} />,
      label: t('viewPortfolio'),
      href: '/simulation',
      category: 'INVESTMENT',
    },
    {
      icon: <MessageSquare className="text-purple-600" size={20} />,
      label: t('askAi'),
      href: '#',
      category: 'AI_MENTOR',
      onClick: () => {
        // AI Mentor trigger logic here
      }
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {actions.map((action, idx) => (
        <Link 
          key={idx}
          href={action.href}
          onClick={() => {
            trackEvent('CLICK_QUICK_ACTION', action.category, { label: action.label });
            if (action.onClick) action.onClick();
          }}
          className="flex flex-col items-center justify-center p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all dark:bg-zinc-900 dark:border-zinc-800"
        >
          <div className="mb-2 p-2 rounded-full bg-zinc-50 dark:bg-zinc-800">
            {action.icon}
          </div>
          <span className="text-sm font-medium">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
