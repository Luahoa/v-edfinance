'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { TrendingUp, Heart, Wallet, ShieldAlert, BarChart3, Lock } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Link } from '@/i18n/routing';

export default function SimulationPage() {
  const t = useTranslations('Simulation');
  const locale = useTranslations().locale;
  
  const [portfolio, setPortfolio] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const data = await api.get('/simulation/portfolio');
        setPortfolio(data);
      } catch (error) {
        console.error('Failed to fetch portfolio', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  if (loading) return <div className="p-20 text-center text-zinc-500">Loading simulation...</div>;

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <BarChart3 className="text-blue-600" /> {t('title')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Sim-Trade Card */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-all cursor-pointer group">
          <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">{t('trade.title')}</h3>
          <p className="text-zinc-500 text-sm mb-4">Trade stocks & crypto with virtual currency.</p>
          <div className="text-blue-600 font-bold">{t('trade.balance', { amount: portfolio?.balance?.toLocaleString() || '0' })}</div>
        </div>

        {/* Sim-Life Card */}
        <Link 
          href={`/${locale}/simulation/life`}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-red-500 transition-all cursor-pointer group flex flex-col"
        >
          <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 mb-4 group-hover:scale-110 transition-transform">
            <Heart size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">{t('life.title')}</h3>
          <p className="text-zinc-500 text-sm mb-4">Navigate through life events and decisions.</p>
          <div className="mt-auto">
            <span className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold inline-block">{t('life.start')}</span>
          </div>
        </Link>

        {/* Sim-Budget Card */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-green-500 transition-all cursor-pointer group">
          <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
            <Wallet size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">{t('budget.title')}</h3>
          <p className="text-zinc-500 text-sm mb-4">{t('budget.rule')}</p>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
            <div className="bg-green-500 w-1/2" />
            <div className="bg-yellow-500 w-1/3" />
            <div className="bg-blue-500 w-1/6" />
          </div>
        </div>

        {/* Sim-Stress Card */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-orange-500 transition-all cursor-pointer group">
          <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
            <ShieldAlert size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Stress Test</h3>
          <p className="text-zinc-500 text-sm mb-4">Can your plan survive a financial crisis?</p>
          <div className="text-orange-600 text-xs font-bold uppercase tracking-wider">High Difficulty</div>
        </div>
      </div>

      {/* Commitment Section */}
      <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Lock size={24} /> {t('commitment.title')}
            </h2>
            <p className="text-blue-100 mb-6">Lock your virtual funds for a goal. Build discipline and earn bonus points, but beware of the penalty!</p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors">
              {t('commitment.lock')}
            </button>
          </div>
          <div className="bg-blue-500/50 backdrop-blur-md p-6 rounded-2xl border border-blue-400/30 w-full md:w-auto">
            <div className="text-sm text-blue-100 mb-2 uppercase font-bold tracking-widest">{t('commitment.penalty')}</div>
            <div className="text-4xl font-bold">-10%</div>
            <div className="text-xs text-blue-200 mt-2">Applied on early withdrawal</div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>
    </div>
  );
}
