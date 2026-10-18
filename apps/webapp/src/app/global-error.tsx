'use client'; // Error boundaries must be Client Components

import {Alert, Box, Button, Grid, Typography} from '@mui/material';
import NextLink from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect, useMemo} from 'react';
import {ActionPaper} from '@/components/ActionPaper';
import {Footer} from '@/components/Layout/Footer';
import {UnauthenticatedMain} from '@/components/Layout/Main';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {logger} from '@/logger';
import {LayoutWrapper} from './layout-wrapper';

export default function GlobalError({error, reset}: {error: Error & {digest?: string}; reset?: () => void}) {
  const t = useAppTranslations();
  const router = useRouter();
  const occurredAt = useMemo(() => new Date().toISOString(), []);
  const errorName = error.name || t('Error');
  const errorMessage = error.message || t('An unexpected error occurred.');

  useEffect(() => {
    logger.error('Global error boundary triggered', error, {
      digest: error.digest,
      occurredAt,
    });
  }, [error, occurredAt]);

  return (
    // global-error must include html and body tags
    <html lang="en">
      <body>
        <LayoutWrapper>
          <UnauthenticatedMain sx={{display: 'flex'}}>
            <ActionPaper
              sx={{
                mt: 'auto',
                px: 3,
                py: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="h1">{t('Ooops!')}</Typography>
              <Typography variant="h2" sx={{mt: 1.5}}>
                {t('Something went wrong!')}
              </Typography>

              <Alert severity="error" sx={{my: 2}}>
                {errorMessage}
              </Alert>

              <Box sx={{mb: 2, textAlign: 'left'}}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  {t('Error type: {errorName}', {errorName})}
                </Typography>
                {error.digest ? (
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                    }}
                  >
                    {t('Reference: {reference}', {reference: error.digest})}
                  </Typography>
                ) : null}
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  {t('Occurred at: {occurredAt}', {occurredAt})}
                </Typography>
                {process.env.NODE_ENV !== 'production' && error.stack ? (
                  <Typography component="pre" variant="caption" sx={{mt: 1, whiteSpace: 'pre-wrap'}}>
                    {error.stack}
                  </Typography>
                ) : null}
              </Box>

              <Grid container spacing={2}>
                <Grid size={{xs: 12, md: 6}}>
                  <Button LinkComponent={NextLink} href="/" fullWidth>
                    {t('Home')}
                  </Button>
                </Grid>
                {reset ? (
                  <Grid size={{xs: 12, md: 6}}>
                    <Button onClick={() => reset()} fullWidth>
                      {t('Try again')}
                    </Button>
                  </Grid>
                ) : (
                  <Grid size={{xs: 12, md: 6}}>
                    <Button onClick={() => router.refresh()} fullWidth>
                      {t('Refresh')}
                    </Button>
                  </Grid>
                )}
              </Grid>
            </ActionPaper>
            <Box sx={{mt: 'auto'}}>
              <Footer />
            </Box>
          </UnauthenticatedMain>
        </LayoutWrapper>
      </body>
    </html>
  );
}
