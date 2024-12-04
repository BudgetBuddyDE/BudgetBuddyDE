import type {Metadata} from 'next';
import {Inter as FontSans} from 'next/font/google';
import Script from 'next/script';

import {Footer} from '@/components/footer';
import {Navbar} from '@/components/navbar';
import {ThemeProvider} from '@/components/theme-provider';
import {Toaster} from '@/components/ui/toaster';
import {cn} from '@/lib/utils';
import '@/style/globals.css';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Budget Buddy',
  description:
    'Budget Buddy is your ultimate self-hostable financial management tool. Track transactions, set budgets, and get insightful financial analysis effortlessly. Automate recurring payments, monitor stock investments, and enjoy full control and privacy with our self-hostable platform. Simplify your finances today with Budget Buddy!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex flex-col min-h-[100dvh]">
            <Navbar />

            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>

        {process.env.NODE_ENV === 'production' && (
          <Script
            async
            src="https://analytics.tools.tklein.it/script.js"
            data-website-id="b7ac220a-eae6-4b1c-a263-3748f31b620e"
          />
        )}
      </body>
    </html>
  );
}
