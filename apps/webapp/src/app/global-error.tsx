'use client'; // Error boundaries must be Client Components

import {Alert, Box, Button, Grid, Typography} from '@mui/material';
import NextLink from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect, useMemo} from 'react';
import {ActionPaper} from '@/components/ActionPaper';
import {Footer} from '@/components/Layout/Footer';
import {UnauthenticatedMain} from '@/components/Layout/Main';
import {logger} from '@/logger';
import {LayoutWrapper} from './layout-wrapper';

export default function GlobalError({error, reset}: {error: Error & {digest?: string}; reset?: () => void}) {
  const router = useRouter();
  const occurredAt = useMemo(() => new Date().toISOString(), []);
  const errorName = error.name || 'Error';
  const errorMessage = error.message || 'An unexpected error occurred.';

  useEffect(() => {
    const payload = {
      name: errorName,
      message: errorMessage,
      digest: error.digest,
      occurredAt,
      stack: error.stack,
    };

    console.error('[GlobalErrorBoundary] Application render failed', payload);
    logger.error('Global error boundary triggered: %o', payload);
  }, [error, errorName, errorMessage, occurredAt]);

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
              <Typography variant="h1">Ooops!</Typography>
              <Typography variant="h2" sx={{mt: 1.5}}>
                Something went wrong!
              </Typography>

              <Alert severity="error" sx={{my: 2}}>
                {errorMessage}
              </Alert>

              <Box sx={{mb: 2, textAlign: 'left'}}>
                <Typography variant="body2" color="text.secondary">
                  Error type: {errorName}
                </Typography>
                {error.digest ? (
                  <Typography variant="body2" color="text.secondary">
                    Reference: {error.digest}
                  </Typography>
                ) : null}
                <Typography variant="body2" color="text.secondary">
                  Occurred at: {occurredAt}
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
                    Home
                  </Button>
                </Grid>
                {reset ? (
                  <Grid size={{xs: 12, md: 6}}>
                    <Button onClick={() => reset()} fullWidth>
                      Try again
                    </Button>
                  </Grid>
                ) : (
                  <Grid size={{xs: 12, md: 6}}>
                    <Button onClick={() => router.refresh()} fullWidth>
                      Refresh
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
