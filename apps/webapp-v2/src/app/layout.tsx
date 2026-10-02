import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import {ColorSchemeScript, MantineProvider, mantineHtmlProps} from '@mantine/core';
import {Notifications} from '@mantine/notifications';
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
        <MantineProvider defaultColorScheme="auto">
          <Notifications position="bottom-right" autoClose={4000} containerWidth={420} zIndex={500} />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
