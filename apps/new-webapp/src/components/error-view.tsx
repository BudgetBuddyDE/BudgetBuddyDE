'use client';

import {Button} from '@/components/ui/button';
import {FeedbackPanel} from './feedback-panel';

export function ErrorView({title = 'Something went wrong', reset}: {title?: string; reset?: () => void}) {
  return (
    <main className="grid min-h-[50dvh] place-items-center p-6">
      <FeedbackPanel
        kind="error"
        title={title}
        description="The request could not be completed. No changes were made."
        action={reset ? <Button onClick={reset}>Try again</Button> : null}
      />
    </main>
  );
}
