'use client';

import {Alert, AlertTitle, Button, Stack, Typography} from '@mui/material';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';
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
  const t = useTranslations('RouteError');
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
        {title}
      </Typography>
      <Alert severity="error">
        <AlertTitle>{t('title')}</AlertTitle>
        {t('description')}
      </Alert>
      {error.digest ? (
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          {t('reference', {digest: error.digest})}
        </Typography>
      ) : null}
      <Button variant="outlined" onClick={() => (reset ? reset() : router.refresh())} sx={{alignSelf: 'flex-start'}}>
        {t('retry')}
      </Button>
    </Stack>
  );
}
