'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname, routing } from '@/i18n/routing';
import { Globe } from 'lucide-react';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const changeLocale = (newLocale: string) => {
    // next-intl handling: use current pathname but change locale
    router.replace(pathname, { locale: newLocale as 'vi' | 'en' | 'zh' });
  };

  return (
    <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
      <Globe className="h-3 w-3" />
      <select 
        value={locale}
        onChange={(e) => changeLocale(e.target.value)}
        className="bg-transparent focus:outline-none cursor-pointer uppercase"
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>
    </div>
  );
}
