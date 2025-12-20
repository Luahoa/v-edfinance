'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import LocaleSwitcher from '@/components/molecules/LocaleSwitcher';
import { useAuthStore } from '@/store/useAuthStore';
import Cookies from 'js-cookie';

export default function RegisterPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Registering with:', { email, name });
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: {
            vi: name,
            en: name,
            zh: name,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Registration successful, setting auth and redirecting...');
        
        // 1. Set state in Zustand
        if (data.user) {
          setAuth(data.user, data.access_token);
        } else {
          // If register returns tokens but user is separate or implicitly in tokens
          setAuth({ id: data.userId, email, role: 'USER' } as any, data.access_token);
        }
        
        // 2. Set Cookie for Middleware
        Cookies.set('token', data.access_token, { expires: 7 });
        
        router.push('/onboarding');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black relative">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher />
      </div>
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg dark:bg-zinc-900">
        <h2 className="text-center text-3xl font-bold">{t('register')}</h2>
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">{t('name')}</label>
              <input
                type="text"
                required
                data-testid="register-name"
                className="mt-1 w-full rounded-md border p-2 dark:bg-zinc-800"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">{t('email')}</label>
              <input
                type="email"
                required
                data-testid="register-email"
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
                data-testid="register-password"
                className="mt-1 w-full rounded-md border p-2 dark:bg-zinc-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            data-testid="register-submit"
            className="w-full rounded-md bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? '...' : t('register')}
          </button>
        </form>
        <p className="text-center text-sm">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
