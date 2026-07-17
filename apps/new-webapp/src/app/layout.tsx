import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import {AppProviders} from './providers';
import '@/theme/globals.css';

export const metadata: Metadata = {
  title: {default: 'BudgetBuddy', template: '%s · BudgetBuddy'},
  description: 'Personal finance workspace for transactions, budgets, and reporting.',
};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="app-root">
          <AppProviders>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}
