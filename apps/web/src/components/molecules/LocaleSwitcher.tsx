'use client';

import { routing } from '@/i18n/routing';
import { Globe } from 'lucide-react';
import { useLocale } from 'next-intl';

export default function LocaleSwitcher() {
  const locale = useLocale();

  const changeLocale = (newLocale: string) => {
    const segments = window.location.pathname.split('/');
    if (routing.locales.includes(segments[1] as 'vi' | 'en' | 'zh')) {
      segments[1] = newLocale;
      window.location.assign(segments.join('/'));
    } else {
      window.location.assign(`/${newLocale}${window.location.pathname}`);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
      <Globe className="h-3 w-3" />
      <select
        value={locale}
        onChange={(e) => changeLocale(e.target.value)}
        data-testid="lang-switcher"
        className="bg-transparent focus:outline-none cursor-pointer uppercase"
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc} data-testid={`lang-option-${loc}`}>
            {loc}
          </option>
        ))}
      </select>
    </div>
  );
}
