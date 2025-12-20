'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import LocaleSwitcher from '@/components/molecules/LocaleSwitcher';
import { useAuthStore } from '@/store/useAuthStore';
import Cookies from 'js-cookie';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import { motion } from 'framer-motion';

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
        if (data.user) {
          setAuth(data.user, data.access_token);
        } else {
          setAuth({ id: data.userId, email, role: 'USER' } as { id: string; email: string; role: string }, data.access_token);
        }
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black relative">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:border dark:border-zinc-800 dark:bg-zinc-900/50 dark:backdrop-blur-xl"
      >
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t('register')}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t('hasAccount')}{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              {t('login')}
            </Link>
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-500 dark:bg-red-900/20 dark:text-red-400"
          >
            {error}
          </motion.div>
        )}

        <form className="space-y-4" onSubmit={handleRegister}>
          <Input
            label={t('name')}
            type="text"
            placeholder="John Doe"
            required
            data-testid="register-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label={t('email')}
            type="email"
            placeholder="name@example.com"
            required
            data-testid="register-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label={t('password')}
            type="password"
            placeholder="••••••••"
            required
            data-testid="register-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            className="w-full"
            isLoading={loading}
            data-testid="register-submit"
          >
            {t('register')}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
