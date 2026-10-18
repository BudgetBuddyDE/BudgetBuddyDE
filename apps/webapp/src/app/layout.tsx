import type {Metadata, Viewport} from 'next';
import type React from 'react';
import {getMessagesForLocale} from '@/i18n/messages';
import {getAppLocale, getAppTranslations, getBrowserLocale} from '@/i18n/server';
import {colors} from '@/theme/DarkTheme/colors';
import {LayoutWrapper} from './layout-wrapper';
import {StoreProvider} from './StoreProvider';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return {
    title: 'Budget Buddy',
    description: t('charts.description'),
    manifest: '/manifest.json',
  };
}

export const viewport: Viewport = {
  themeColor: [
    {
      media: '(prefers-color-scheme: light)',
      color: colors.background?.default as string,
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: colors.background?.default as string,
    },
  ],
};
export default async function RootLayout({children}: {children: React.ReactNode}) {
  const locale = await getAppLocale();
  const browserLocale = await getBrowserLocale();
  return (
    <StoreProvider>
      <html lang={locale} suppressHydrationWarning>
        <body>
          <LayoutWrapper locale={locale} browserLocale={browserLocale} messages={getMessagesForLocale(locale)}>
            {children}
          </LayoutWrapper>
        </body>
      </html>
    </StoreProvider>
  );
}
