'use client';

import {RouteErrorFallback} from '@/components/ErrorBoundary';

export default function AttachmentsError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return <RouteErrorFallback error={error} reset={reset} title="Attachments are temporarily unavailable" />;
}
