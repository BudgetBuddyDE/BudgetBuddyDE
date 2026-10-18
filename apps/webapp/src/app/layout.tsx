import type {Metadata, Viewport} from 'next';
import type React from 'react';
import {DEFAULT_LOCALE} from '@/lib/i18n/config';
import {englishMessages} from '@/lib/i18n/messages';
import {getAppTranslations} from '@/lib/i18n/server';
import {colors} from '@/theme/DarkTheme/colors';
import {LayoutWrapper} from './layout-wrapper';
import {StoreProvider} from './StoreProvider';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return {
    title: 'Budget Buddy',
    description: t('Manage your budgets effortlessly with Budget Buddy.'),
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
export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <StoreProvider>
      <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
        <body>
          <LayoutWrapper messages={englishMessages}>{children}</LayoutWrapper>
        </body>
      </html>
    </StoreProvider>
  );
}
