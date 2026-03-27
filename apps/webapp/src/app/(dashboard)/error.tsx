'use client';

import {Alert, Button, Stack, Typography} from '@mui/material';
import {useEffect} from 'react';
import {logger} from '@/logger';

export default function DashboardError({
  error,
  reset,
}: Readonly<{
  error: Error & {digest?: string};
  reset: () => void;
}>) {
  useEffect(() => {
    logger.error('Dashboard route failed to render: %o', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <Stack spacing={2} sx={{mt: 2}}>
      <Typography variant="h5" fontWeight={700}>
        Dashboard is temporarily unavailable
      </Typography>
      <Alert severity="error">We could not render this dashboard view. Please try again in a few moments.</Alert>
      {error.digest ? (
        <Typography variant="caption" color="text.secondary">
          Error reference: {error.digest}
        </Typography>
      ) : null}
      <Stack direction="row" spacing={1}>
        <Button variant="contained" onClick={() => reset()}>
          Try again
        </Button>
      </Stack>
    </Stack>
  );
}
