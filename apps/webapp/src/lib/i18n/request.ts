import {getRequestConfig} from 'next-intl/server';
import {DEFAULT_LOCALE} from './config';
import {englishMessages} from './messages';

export default getRequestConfig(async () => ({
  locale: DEFAULT_LOCALE,
  messages: englishMessages,
  timeZone: 'UTC',
}));
