import type {Metadata, Viewport} from 'next';
import './globals.css';
import {FeedbackProvider} from '@/components/feedback-provider';
import {I18nProvider} from '@/lib/i18n';
import {ThemeProvider} from '@/theme/theme-provider';

export const metadata: Metadata = {
  title: {default: 'BudgetBuddy · Finance workspace', template: '%s · BudgetBuddy'},
  applicationName: 'BudgetBuddy',
  description: 'A calm workspace for transactions, budgets, recurring payments, and financial reporting.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{url: '/brand/app-icon.svg', type: 'image/svg+xml'}],
    shortcut: '/brand/app-icon.svg',
    apple: '/brand/app-icon.svg',
  },
};

export const viewport: Viewport = {width: 'device-width', initialScale: 1, themeColor: '#0b1720'};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <I18nProvider>
          <ThemeProvider>
            <FeedbackProvider>{children}</FeedbackProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
