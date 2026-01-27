import * as fs from 'fs/promises';
import * as path from 'path';
import locales from './locales.json';

export interface CertificateData {
  recipientName: string;
  courseTitle: string;
  completedAt: Date;
  certificateId: string;
  locale: 'vi' | 'en' | 'zh';
}

/**
 * Renders the HTML certificate template with localized data
 * 
 * @param data - Certificate data with user and course information
 * @returns HTML string ready for PDF generation
 */
export async function renderCertificateTemplate(
  data: CertificateData
): Promise<string> {
  const templatePath = path.join(__dirname, 'certificate-template.html');
  let template = await fs.readFile(templatePath, 'utf-8');

  // Get localized strings
  const locale = locales[data.locale] || locales.vi;

  // Format date based on locale
  const dateValue = formatDate(data.completedAt, data.locale);

  // Prepare replacement map
  const replacements: Record<string, string> = {
    '{{title}}': locale.title,
    '{{subtitle}}': locale.subtitle,
    '{{presentedTo}}': locale.presentedTo,
    '{{recipientName}}': data.recipientName,
    '{{completionText}}': locale.completionText,
    '{{courseTitle}}': data.courseTitle,
    '{{dateLabel}}': locale.dateLabel,
    '{{dateValue}}': dateValue,
    '{{signerName}}': locale.signerName,
    '{{signerTitle}}': locale.signerTitle,
    '{{verificationCode}}': `${locale.verificationPrefix}: ${data.certificateId.toUpperCase()}`,
  };

  // Replace all placeholders
  for (const [placeholder, value] of Object.entries(replacements)) {
    template = template.replace(new RegExp(placeholder, 'g'), value);
  }

  return template;
}

/**
 * Format date based on locale
 */
function formatDate(date: Date, locale: 'vi' | 'en' | 'zh'): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  switch (locale) {
    case 'vi':
      return `${day}/${month}/${year}`;
    case 'en':
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    case 'zh':
      return `${year}年${month}月${day}日`;
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Preview: Generate sample certificate HTML for testing
 */
export async function generateSampleCertificate(
  locale: 'vi' | 'en' | 'zh' = 'vi'
): Promise<string> {
  const sampleData: CertificateData = {
    recipientName: locale === 'vi' ? 'Nguyễn Văn B' : locale === 'zh' ? '李明' : 'John Smith',
    courseTitle:
      locale === 'vi'
        ? 'Tài Chính Hành Vi Cơ Bản'
        : locale === 'zh'
          ? '基础行为金融学'
          : 'Introduction to Behavioral Finance',
    completedAt: new Date(),
    certificateId: 'cert-' + Math.random().toString(36).substring(2, 15),
    locale,
  };

  return renderCertificateTemplate(sampleData);
}
