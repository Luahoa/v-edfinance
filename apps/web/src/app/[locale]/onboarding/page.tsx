'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 text-center dark:bg-black">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-lg dark:bg-zinc-900">
        <h1 className="text-3xl font-bold">Chào mừng bạn đến với hành trình tài chính</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Hãy cùng thiết lập hồ sơ để cá nhân hóa trải nghiệm học tập của bạn.
        </p>

        <div className="mt-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Bước 1: Kiến thức của bạn</h2>
              <div className="flex flex-col gap-2">
                <button onClick={nextStep} data-testid="onboarding-beginner" className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">Mới bắt đầu</button>
                <button onClick={nextStep} className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">Đã có kinh nghiệm</button>
                <button onClick={nextStep} className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">Chuyên gia</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Bước 2: Mục tiêu đầu tư</h2>
              <div className="flex flex-col gap-2">
                <button onClick={nextStep} data-testid="onboarding-longterm" className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">Dài hạn</button>
                <button onClick={nextStep} className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">Ngắn hạn</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Bước 3: Mức độ rủi ro</h2>
              <div className="flex flex-col gap-2">
                <button onClick={nextStep} data-testid="onboarding-medium" className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">Trung bình</button>
                <button onClick={nextStep} className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">Thấp</button>
                <button onClick={nextStep} className="rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">Cao</button>
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
            Quay lại
          </button>
          <button 
            onClick={nextStep}
            data-testid="onboarding-complete"
            className="rounded-full bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
          >
            {step === 3 ? 'Hoàn tất' : 'Tiếp theo'}
          </button>
        </div>
      </div>
    </div>
  );
}
