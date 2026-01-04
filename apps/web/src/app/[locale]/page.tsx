import {getTranslations} from 'next-intl/server';
import Link from 'next/link';

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ArrowRight, Users, TrendingUp, ShieldCheck } from 'lucide-react';

export default async function Index({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('Index');

  return (
<<<<<<< Updated upstream
    <div className="flex min-h-screen flex-col">
      {/* Hero Section with Farming Metaphor */}
      <section className="relative overflow-hidden bg-green-50 dark:bg-green-950/20 py-20 sm:py-32 lg:pb-32 xl:pb-36">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
            <div className="relative z-10 mx-auto max-w-2xl lg:col-span-7 lg:max-w-none lg:pt-6 xl:col-span-6">
              <h1 className="text-4xl font-bold tracking-tight text-green-900 dark:text-green-50 sm:text-6xl">
                {t('title')}
              </h1>
              <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
                {t('description')}
              </p>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-4">
                <Link
                  href={`/${locale}/courses`}
                  className="inline-flex items-center justify-center rounded-lg bg-green-600 px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-all hover:scale-105"
                >
                  {t('getStarted')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href={`/${locale}/login`}
                  className="inline-flex items-center justify-center rounded-lg px-8 py-4 text-base font-semibold text-green-900 ring-1 ring-inset ring-green-200 hover:ring-green-300 dark:text-green-100 dark:ring-green-800 transition-all"
                >
                  Log In
                </Link>
              </div>
              
              {/* Social Proof (Nudge) */}
              <div className="mt-10 flex items-center gap-x-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full bg-green-200 ring-2 ring-white dark:ring-gray-900" />
                  ))}
                </div>
                <div className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-green-700 dark:text-green-400">1,000+</span> students joined this week
                </div>
              </div>
            </div>
            
            {/* Visual Metaphor Placeholder */}
            <div className="relative mt-10 sm:mt-20 lg:col-span-5 lg:row-span-2 lg:mt-0 xl:col-span-6">
              <div className="absolute left-1/2 top-4 h-[1026px] w-[1026px] -translate-x-1/3 stroke-gray-300/70 [mask-image:linear-gradient(to_bottom,white,20%,transparent,75%)] sm:top-16 sm:-translate-x-1/2 lg:-top-16 lg:ml-12 xl:-top-14 xl:ml-0 dark:stroke-gray-700/70">
                <svg
                  viewBox="0 0 1026 1026"
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full animate-spin-slow"
                >
                  <circle cx="513" cy="513" r="513" fill="url(#gradient)" fillOpacity="0.1" />
                  <defs>
                    <radialGradient id="gradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(513 513) rotate(90) scale(513)">
                      <stop stopColor="#16a34a" />
                      <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                </svg>
              </div>
              <div className="relative rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4 dark:bg-white/5 dark:ring-white/10">
                <div className="rounded-md bg-white p-8 shadow-2xl ring-1 ring-gray-900/10 dark:bg-gray-900">
                  {/* Dashboard Preview */}
                  <div className="space-y-4">
                    <div className="h-8 w-1/3 rounded bg-green-100 dark:bg-green-900/50" />
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-24 rounded bg-blue-50 dark:bg-blue-900/20" />
                      <div className="h-24 rounded bg-green-50 dark:bg-green-900/20" />
                      <div className="h-24 rounded bg-orange-50 dark:bg-orange-900/20" />
                    </div>
                    <div className="h-32 rounded bg-gray-50 dark:bg-gray-800" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid (Value Prop) */}
      <section className="bg-white py-24 sm:py-32 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-green-600">Smart Finance</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Everything you need to grow your wealth
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
              Just like farming, wealth requires patience, right tools, and daily care. We provide the ecosystem for your financial harvest.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  name: 'Learn by Doing',
                  description: 'Interactive simulations and quizzes. Plant seeds of knowledge and watch them grow.',
                  icon: TrendingUp,
                },
                {
                  name: 'Community Support',
                  description: 'Join a Buddy Group. Farming is better together. Keep each other accountable.',
                  icon: Users,
                },
                {
                  name: 'Bank-Grade Security',
                  description: 'Your data is protected with enterprise-grade encryption. Safe as a vault.',
                  icon: ShieldCheck,
                },
              ].map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                    <feature.icon className="h-5 w-5 flex-none text-green-600" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-400">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
=======
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 text-center dark:bg-black">
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{t('title')}</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">{t('description')}</p>
      <Link 
        href={`/${locale}/courses`}
        className="mt-8 rounded-full bg-blue-600 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-700"
      >
        {t('getStarted')}
      </Link>
>>>>>>> Stashed changes
    </div>
  );
}
