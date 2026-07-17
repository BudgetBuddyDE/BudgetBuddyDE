'use client';

import {ErrorView} from '@/components/error-view';

export default function GlobalError({reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return (
    <html lang="en">
      <body>
        <ErrorView title="BudgetBuddy could not start" reset={reset} />
      </body>
    </html>
  );
}
