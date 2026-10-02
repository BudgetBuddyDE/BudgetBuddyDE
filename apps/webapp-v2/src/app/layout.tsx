import '@mantine/core/styles.css';
import {ColorSchemeScript, MantineProvider, mantineHtmlProps} from '@mantine/core';
import type {Metadata} from 'next';
import type {ReactNode} from 'react';

export const metadata: Metadata = {
  title: 'BudgetBuddyDE Webapp v2',
  description: 'Next.js and Mantine starter for BudgetBuddyDE.',
};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">{children}</MantineProvider>
      </body>
    </html>
  );
}
