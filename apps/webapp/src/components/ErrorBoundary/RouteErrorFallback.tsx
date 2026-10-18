'use client';

import {Alert, AlertTitle, Button, Stack, Typography} from '@mui/material';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {logger} from '@/logger';

export type RouteErrorFallbackProps = {
  error: Error & {digest?: string};
  reset?: () => void;
  title?: string;
};

export function RouteErrorFallback({error, reset, title}: RouteErrorFallbackProps) {
  const t = useAppTranslations();
  const router = useRouter();

  useEffect(() => {
    logger.error('Route error boundary triggered', error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <Stack spacing={1.5} sx={{my: 2}}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
        }}
      >
        {title ?? t('This section is temporarily unavailable')}
      </Typography>
      <Alert severity="error">
        <AlertTitle>{t('We could not load this section')}</AlertTitle>
        {t('Please try again. Your other page sections remain available.')}
      </Alert>
      {error.digest ? (
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          {t('Error reference: {reference}', {reference: error.digest})}
        </Typography>
      ) : null}
      <Button variant="outlined" onClick={() => (reset ? reset() : router.refresh())} sx={{alignSelf: 'flex-start'}}>
        {t('Try again')}
      </Button>
    </Stack>
  );
}
