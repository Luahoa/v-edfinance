'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocale } from 'next-intl';
import { Info, X, Zap, Users, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Nudge {
  type: string;
  message: {
    vi: string;
    en: string;
    zh: string;
  };
  priority: string;
}

export default function NudgeBanner() {
  const { token } = useAuthStore();
  const locale = useLocale() as 'vi' | 'en' | 'zh';
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchNudges = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/nudge/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setNudges(data);
            setVisible(true);
          }
        }
      } catch (err) {
        console.error('Fetch nudges error:', err);
      }
    };

    fetchNudges();
  }, [token]);

  if (!visible || nudges.length === 0) return null;

  const currentNudge = nudges[0];

  const getIcon = (type: string) => {
    switch (type) {
      case 'SOCIAL_PROOF': 
        return <Users className="text-blue-500" size={20} />;
      case 'LOSS_AVERSION': 
        return <Zap className="text-amber-500" size={20} />;
      case 'GOAL_GRADIENT': 
        return <TrendingUp className="text-green-500" size={20} />;
      default: 
        return <Info className="text-zinc-500" size={20} />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="mb-6 overflow-hidden"
      >
        <div className={`flex items-center justify-between p-4 rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 border-l-4 ${
          currentNudge.priority === 'HIGH' ? 'border-l-amber-500' : 'border-l-blue-500'
        }`}>
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-zinc-50 dark:bg-zinc-800">
              {getIcon(currentNudge.type)}
            </div>
            <div>
              <p className="text-sm font-medium">{currentNudge.message[locale]}</p>
            </div>
          </div>
          <button onClick={() => setVisible(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
            <X size={16} className="text-zinc-400" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
