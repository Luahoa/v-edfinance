'use client';

import { api } from '@/lib/api-client';
import { AlertCircle, CheckCircle2, ShieldCheck, ShoppingBag, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export default function StorePage() {
  const t = useTranslations('Store');
  const td = useTranslations('Dashboard');
  const locale = useTranslations().locale as 'vi' | 'en' | 'zh';
  const [items, setItems] = useState<unknown[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const data = await api.get<unknown[]>('/store/items');
        setItems(data);
      } catch (error) {
        console.error('Failed to fetch store items', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserPoints = async () => {
      try {
        const data = await api.get<{ points: number }>('/users/profile');
        setUserPoints(data.points);
      } catch (error) {
        console.error('Failed to fetch user points', error);
      }
    };

    fetchStoreData();
    fetchUserPoints();
  }, []);

  const handleBuy = async (itemId: string) => {
    setPurchasing(itemId);
    setMessage(null);
    try {
      if (itemId === 'streak-freeze') {
        await api.post('/store/buy/streak-freeze', {});
        setMessage({ type: 'success', text: t('purchaseSuccess') });
        // Refresh balance manually or via context
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      setMessage({ type: 'error', text: err.message || t('insufficientPoints') });
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingBag className="text-purple-500" /> {t('title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {t('balance', { points: userPoints.toLocaleString() })}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full flex items-center gap-2 border border-blue-100 dark:border-blue-800">
          <Star className="text-blue-600 fill-blue-600" size={20} />
          <span className="font-bold text-blue-700 dark:text-blue-400">
            {userPoints.toLocaleString()} {td('points')}
          </span>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
              : 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white dark:bg-zinc-900 h-48 rounded-xl border border-zinc-200 dark:border-zinc-800"
              />
            ))
          : items.map((it) => {
              const item = it as {
                id: string;
                name: Record<string, string>;
                description: Record<string, string>;
                price: number;
              };
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div>
                    <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-4">
                      {item.id === 'streak-freeze' ? <ShieldCheck size={28} /> : <Star size={28} />}
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                      {item.name[locale] || item.name.en}
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">
                      {item.description[locale] || item.description.en}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                      <Star size={18} className="text-blue-600 fill-blue-600" />
                      {item.price.toLocaleString()}
                    </div>
                    <button
                      onClick={() => handleBuy(item.id)}
                      disabled={purchasing === item.id || userPoints < item.price}
                      className={`px-6 py-2 rounded-lg font-bold transition-all ${
                        userPoints >= item.price
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-95'
                          : 'bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800'
                      }`}
                    >
                      {purchasing === item.id ? td('aiPlaceholder') : t('buy')}
                    </button>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
