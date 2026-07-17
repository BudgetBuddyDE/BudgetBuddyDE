'use client';

import {useEffect} from 'react';
import {ErrorView} from '@/components/error-view';
import {logger} from '@/logger';

export default function RouteError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  useEffect(() => {
    logger.error('Route rendering failed', {digest: error.digest});
  }, [error.digest]);
  return <ErrorView reset={reset} />;
}
