import {getRequestConfig} from 'next-intl/server';
import {authClient} from '@/authClient';
import {headers} from '@/lib/headers';
import {getPreferences} from '@/lib/preferences/getPreferences';
import {resolveBrowserLocale} from './browserLocale';
import {DEFAULT_LOCALE, resolveAppLocale} from './config';
import {getMessagesForLocale} from './messages';

export default getRequestConfig(async () => {
  const requestHeaders = await headers();
  let locale = DEFAULT_LOCALE;
  if (requestHeaders.get('x-budgetbuddy-auth-route') === '1') {
    locale = resolveBrowserLocale(requestHeaders.get('accept-language'));
  }

  // The proxy must overwrite this header; public requests never fetch preferences.
  if (requestHeaders.get('x-budgetbuddy-authenticated-route') === '1') {
    const session = await authClient.getSession({fetchOptions: {headers: requestHeaders}});
    if (!session.error && session.data) {
      const [response] = await getPreferences();
      locale = resolveAppLocale(response?.data.language);
    }
  }

  return {locale, messages: getMessagesForLocale(locale), timeZone: 'UTC'};
});
