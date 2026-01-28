'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Share2, FileText, AlertCircle } from 'lucide-react';
import { formatDate } from 'date-fns';
import { trpc } from '@/lib/trpc';

interface Certificate {
  id: string;
  courseId: string;
  courseName: string;
  earnedDate: Date;
  certificateUrl?: string;
}

export default function CertificatesPage() {
  const t = useTranslations('Certificates');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const locale = useLocale();

  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { data: certificatesData, isLoading, error } = trpc.certificate.getMyCertificates.useQuery();

  const certificates: Certificate[] = (certificatesData ?? []).map((cert) => ({
    id: cert.id,
    courseId: cert.course?.id ?? '',
    courseName: cert.courseTitle?.[locale] ?? cert.courseTitle?.vi ?? t('untitledCourse'),
    earnedDate: new Date(cert.completedAt),
    certificateUrl: cert.pdfUrl ?? undefined,
  }));

  const handleDownload = async (certificateId: string): Promise<void> => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');

      if (!token) return;

      const response = await fetch(`${API_URL}/certificates/${certificateId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(t('downloadError'));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : t('downloadError'));
    }
  };

  const handleShare = (certificateId: string): void => {
    const shareUrl = `${window.location.origin}/certificates/view/${certificateId}`;
    navigator.clipboard.writeText(shareUrl);
    setShareMessage(t('linkCopied'));
    setTimeout(() => setShareMessage(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-zinc-600">
          {t('subtitle')}
        </p>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {downloadError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{downloadError}</AlertDescription>
        </Alert>
      )}

      {shareMessage && (
        <Alert className="mb-6">
          <Share2 className="h-4 w-4" />
          <AlertDescription>{shareMessage}</AlertDescription>
        </Alert>
      )}

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-16 w-16 text-zinc-300 mb-4" />
            <p className="text-lg text-zinc-500 mb-4">{t('noCertificates')}</p>
            <Button onClick={() => router.push('/courses')} variant="outline">
              {t('browseCourses')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map(cert => (
            <Card key={cert.id} className="overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                <FileText className="h-20 w-20 text-white opacity-50" />
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{cert.courseName}</CardTitle>
                <CardDescription>
                  {t('earnedOn', { date: formatDate(new Date(cert.earnedDate), 'PP') })}
                </CardDescription>
                <p className="text-xs text-zinc-500">
                  {t('certificateId')}: {cert.id.slice(0, 8)}...
                </p>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  onClick={() => handleDownload(cert.id)}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('download')}
                </Button>
                <Button
                  onClick={() => handleShare(cert.id)}
                  variant="outline"
                  size="sm"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
