import {cookies} from 'next/headers';
import {getRequestConfig} from 'next-intl/server';
import {DEFAULT_LOCALE, normalizeLocale} from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get('budgetbuddy-locale')?.value ?? DEFAULT_LOCALE);
  return {
    locale,
    messages:
      locale === 'de-DE'
        ? (await import('./messages/de-DE.json')).default
        : (await import('./messages/en-US.json')).default,
  };
});
