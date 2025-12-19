import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import "./../globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";
import { GlobalErrorBoundary } from '@/components/atoms/GlobalErrorBoundary';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  
  if (!routing.locales.includes(locale as 'vi' | 'en' | 'zh')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <NextIntlClientProvider messages={messages}>
          <GlobalErrorBoundary>
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </GlobalErrorBoundary>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
