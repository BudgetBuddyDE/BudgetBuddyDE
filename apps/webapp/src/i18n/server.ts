import 'server-only';
import {getLocale, getTranslations} from 'next-intl/server';
import {resolveAppLocale, type AppLocale} from './config';
import {createAppTranslator, type AppTranslator} from './translate';

export async function getAppLocale(): Promise<AppLocale> {
  return resolveAppLocale(await getLocale());
}

export async function getAppTranslations(): Promise<AppTranslator> {
  return createAppTranslator(await getTranslations());
}
