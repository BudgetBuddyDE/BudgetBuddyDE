import 'server-only';
import {getTranslations} from 'next-intl/server';
import {createAppTranslator, type AppTranslator} from './translate';

export async function getAppTranslations(): Promise<AppTranslator> {
  return createAppTranslator(await getTranslations());
}
