import type {Metadata, Viewport} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {default: 'BudgetBuddy · Finance workspace', template: '%s · BudgetBuddy'},
  description: 'A calm workspace for transactions, budgets, recurring payments, and financial reporting.',
};

export const viewport: Viewport = {width: 'device-width', initialScale: 1, themeColor: '#0b1720'};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
