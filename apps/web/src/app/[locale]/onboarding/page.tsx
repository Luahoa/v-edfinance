'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function OnboardingPage() {
  const t = useTranslations('Onboarding');
  const router = useRouter();
  const [step, setStep] = useState(1);

  const nextStep = () => {
    console.log('Current step:', step);
    if (step < 3) {
      const next = step + 1;
      console.log('Moving to step:', next);
      setStep(next);
    } else {
      console.log('Onboarding complete, redirecting to dashboard');
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 text-center dark:bg-black">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-lg dark:bg-zinc-900">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          {t('description')}
        </p>

        <div className="mt-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t('step1Title')}</h2>
              <div className="flex flex-col gap-2">
                <button onClick={nextStep} data-testid="onboarding-beginner" className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">{t('beginner')}</button>
                <button onClick={nextStep} className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">{t('experienced')}</button>
                <button onClick={nextStep} className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">{t('expert')}</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t('step2Title')}</h2>
              <div className="flex flex-col gap-2">
                <button onClick={nextStep} data-testid="onboarding-longterm" className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">{t('longTerm')}</button>
                <button onClick={nextStep} className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">{t('shortTerm')}</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t('step3Title')}</h2>
              <div className="flex flex-col gap-2">
                <button onClick={nextStep} data-testid="onboarding-medium" className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">{t('medium')}</button>
                <button onClick={nextStep} className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">{t('low')}</button>
                <button onClick={nextStep} className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">{t('high')}</button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-between">
          <button 
            onClick={() => setStep(Math.max(1, step - 1))}
            className="text-sm text-zinc-500 hover:underline"
            disabled={step === 1}
          >
            {t('back')}
          </button>
          <button 
            onClick={nextStep}
            data-testid="onboarding-complete"
            className="rounded-full bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
          >
            {step === 3 ? t('complete') : t('next')}
          </button>
        </div>
      </div>
    </div>
  );
}
