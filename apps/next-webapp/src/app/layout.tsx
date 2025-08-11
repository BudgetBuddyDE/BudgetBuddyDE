import React from 'react';
import { LayoutWrapper } from './layout-wrapper';
import { StoreProvider } from './StoreProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
