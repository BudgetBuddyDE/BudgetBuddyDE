import type {Metadata, Viewport} from 'next';
import type React from 'react';
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
export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <StoreProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <LayoutWrapper>{children}</LayoutWrapper>
        </body>
      </html>
    </StoreProvider>
  );
}
