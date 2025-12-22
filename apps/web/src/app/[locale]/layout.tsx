import { routing } from '@/i18n/routing';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import './../globals.css';
import { GlobalErrorBoundary } from '@/components/atoms/GlobalErrorBoundary';
import Footer from '@/components/organisms/Footer';
import { DesktopNav, MobileMenu, MobileNav } from '@/components/organisms/Navigation';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'vi' | 'en' | 'zh')) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-zinc-50 dark:bg-black`}
      >
        <NextIntlClientProvider messages={messages}>
          <GlobalErrorBoundary>
            <DesktopNav />
            <MobileMenu />
            <main className="flex-grow pb-16 lg:pb-0">{children}</main>
            <Footer />
            <MobileNav />
          </GlobalErrorBoundary>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
