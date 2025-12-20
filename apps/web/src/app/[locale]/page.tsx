import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function Index({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('Index');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 text-center dark:bg-black">
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{t('title')}</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">{t('description')}</p>
      <Link
        href={`/${locale}/courses`}
        className="mt-8 rounded-full bg-blue-600 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-700"
      >
        {t('getStarted')}
      </Link>
    </div>
  );
}
