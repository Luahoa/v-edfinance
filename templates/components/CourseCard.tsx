'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

interface CourseCardProps {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  thumbnailUrl: string;
  price: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  locale: string;
}

export default function CourseCard({
  id,
  title,
  description,
  thumbnailUrl,
  price,
  level,
  locale,
}: CourseCardProps) {
  const t = useTranslations('courses');

  const localizedTitle = title[locale] || title.vi;
  const localizedDesc = description[locale] || description.vi;

  return (
    <Link href={`/${locale}/courses/${id}`}>
      <div className="course-card">
        <Image src={thumbnailUrl} alt={localizedTitle} width={300} height={200} />
        <h3>{localizedTitle}</h3>
        <p>{localizedDesc}</p>
        <div className="meta">
          <span className="level">{t(`level.${level.toLowerCase()}`)}</span>
          <span className="price">{price === 0 ? t('free') : `${price / 100} VND`}</span>
        </div>
      </div>
    </Link>
  );
}
