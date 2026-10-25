import {getRequestConfig} from 'next-intl/server';
import {DEFAULT_LOCALE} from './config';

export default getRequestConfig(async ({requestLocale}) => {
  const requestedLocale = await requestLocale;
  const locale = requestedLocale === DEFAULT_LOCALE ? requestedLocale : DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import('../messages/en-US.json')).default,
  };
});
