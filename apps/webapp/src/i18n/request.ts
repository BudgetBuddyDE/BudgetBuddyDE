import {cookies, headers} from 'next/headers';
import {getRequestConfig} from 'next-intl/server';
import {apiClient} from '@/apiClient';
import {resolveLocale} from './config';
import type {SupportedLocale} from './config';

export async function resolveRequestLocale({
  cookieLocale,
  acceptLanguage,
  preferenceLanguage,
}: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
  preferenceLanguage?: string | null;
}): Promise<SupportedLocale> {
  if (preferenceLanguage != null) return resolveLocale({preferenceLanguage});
  if (cookieLocale != null) return resolveLocale({cookieLocale});
  return resolveLocale({acceptLanguage});
}

export async function createRequestConfig() {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const cookieLocale = cookieStore.get('budgetbuddy-locale')?.value;
  const acceptLanguage = requestHeaders.get('accept-language');
  const cookieHeader = requestHeaders.get('cookie');
  let preferenceLanguage: string | undefined;
  if (cookieHeader) {
    const [preferenceResult] = await apiClient.backend.preference.get({
      headers: {cookie: cookieHeader},
      cache: 'no-store',
    });
    preferenceLanguage = preferenceResult?.data.language;
  }
  const locale = await resolveRequestLocale({preferenceLanguage, cookieLocale, acceptLanguage});
  return {
    locale,
    messages:
      locale === 'de-DE'
        ? (await import('./messages/de-DE.json')).default
        : (await import('./messages/en-US.json')).default,
  };
}

export default getRequestConfig(createRequestConfig);
