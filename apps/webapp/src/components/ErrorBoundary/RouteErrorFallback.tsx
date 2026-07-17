'use client';

import {Alert, AlertTitle, Button, Stack, Typography} from '@mui/material';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {logger} from '@/logger';

export type RouteErrorFallbackProps = {
  error: Error & {digest?: string};
  reset?: () => void;
  title?: string;
};

export function RouteErrorFallback({
  error,
  reset,
  title = 'This section is temporarily unavailable',
}: RouteErrorFallbackProps) {
  const router = useRouter();

  useEffect(() => {
    logger.error('Route error boundary triggered: %o', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <Stack spacing={1.5} sx={{my: 2}}>
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
      <Alert severity="error">
        <AlertTitle>We could not load this section</AlertTitle>
        Please try again. Your other page sections remain available.
      </Alert>
      {error.digest ? (
        <Typography variant="caption" color="text.secondary">
          Error reference: {error.digest}
        </Typography>
      ) : null}
      <Button variant="outlined" onClick={() => (reset ? reset() : router.refresh())} sx={{alignSelf: 'flex-start'}}>
        Try again
      </Button>
    </Stack>
  );
}
