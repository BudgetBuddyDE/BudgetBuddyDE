'use client';

import {Button} from '@/components/ui/primitives';

export default function GlobalError({reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return (
    <html lang="en">
      <body>
        <main className="fatal-error">
          <p className="eyebrow">Unexpected error</p>
          <h1>BudgetBuddy needs a fresh start.</h1>
          <p>Your data was not changed. Reload this view to continue.</p>
          <Button onClick={reset}>Reload application</Button>
        </main>
      </body>
    </html>
  );
}
