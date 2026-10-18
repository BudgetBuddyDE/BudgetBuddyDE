import 'server-only';
import {getLocale, getTranslations} from 'next-intl/server';
import {headers} from '@/lib/headers';
import {resolveBrowserLocale} from './browserLocale';
import {resolveAppLocale, type AppLocale} from './config';
import {createAppTranslator, type AppTranslator} from './translate';

export async function getAppLocale(): Promise<AppLocale> {
  return resolveAppLocale(await getLocale());
}

export async function getBrowserLocale(): Promise<AppLocale> {
  return resolveBrowserLocale((await headers()).get('accept-language'));
}

export async function getAppTranslations(): Promise<AppTranslator> {
  return createAppTranslator(await getTranslations());
}
