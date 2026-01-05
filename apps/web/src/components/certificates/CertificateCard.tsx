'use client';

import { useLocale } from 'next-intl';
import { Download, Share2, Award } from 'lucide-react';

interface Certificate {
  id: string;
  studentName: Record<string, string>;
  courseTitle: Record<string, string>;
  completedAt: Date;
  pdfUrl: string;
}

interface CertificateCardProps {
  certificate: Certificate;
  onDownload?: (url: string) => void;
  onShare?: (certificate: Certificate) => void;
}

export function CertificateCard({
  certificate,
  onDownload,
  onShare,
}: CertificateCardProps) {
  const locale = useLocale();

  const handleDownload = () => {
    if (onDownload) {
      onDownload(certificate.pdfUrl);
    } else {
      // Default: open in new tab
      window.open(certificate.pdfUrl, '_blank');
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(certificate);
    } else {
      // Default: copy link
      navigator.clipboard.writeText(certificate.pdfUrl);
      alert('Certificate link copied to clipboard!');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      {/* Certificate Icon */}
      <div className="flex items-start gap-4 mb-4">
        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
          <Award className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">
            {certificate.courseTitle[locale] || certificate.courseTitle.vi}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {certificate.studentName[locale] || certificate.studentName.vi}
          </p>
        </div>
      </div>

      {/* Completion Date */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Completed: {new Date(certificate.completedAt).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
        
        <button
          type="button"
          onClick={handleShare}
          className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Share certificate"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
