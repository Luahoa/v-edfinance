'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import { useAuthStore } from '@/store/useAuthStore';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // 1. Set state in Zustand
        setAuth(data.user, data.access_token);
        
        // 2. Set Cookie for Middleware (server-side)
        Cookies.set('token', data.access_token, { expires: 7 }); // 7 days
        
        router.push('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg dark:bg-zinc-900">
        <h2 className="text-center text-3xl font-bold">{t('login')}</h2>
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">{t('email')}</label>
              <input
                type="email"
                required
                className="mt-1 w-full rounded-md border p-2 dark:bg-zinc-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">{t('password')}</label>
              <input
                type="password"
                required
                className="mt-1 w-full rounded-md border p-2 dark:bg-zinc-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? '...' : t('login')}
          </button>
        </form>
        <p className="text-center text-sm">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
