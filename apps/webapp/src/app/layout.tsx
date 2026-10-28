import type {Metadata, Viewport} from 'next';
import {getLocale, getMessages} from 'next-intl/server';
import type React from 'react';
import {normalizeLocale} from '@/i18n/config';
import {colors} from '@/theme/DarkTheme/colors';
import {LayoutWrapper} from './layout-wrapper';
import {StoreProvider} from './StoreProvider';

export const metadata: Metadata = {
  title: 'Budget Buddy',
  description: 'Manage your budgets effortlessly with Budget Buddy.',
  manifest: '/manifest.json',
};

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
  const locale = await getLocale();
  const normalizedLocale = normalizeLocale(locale);
  const messages = await getMessages();
  return (
    <StoreProvider>
      <html lang={normalizedLocale} suppressHydrationWarning>
        <body>
          <LayoutWrapper locale={normalizedLocale} messages={messages}>
            {children}
          </LayoutWrapper>
        </body>
      </html>
    </StoreProvider>
  );
}
