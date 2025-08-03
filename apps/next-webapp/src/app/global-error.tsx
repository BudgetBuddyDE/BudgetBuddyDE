'use client'; // Error boundaries must be Client Components

import NextLink from 'next/link';
import { ActionPaper } from '@/components/ActionPaper';
import { UnauthenticatedMain } from '@/components/Layout/Main';
import { Alert, AlertTitle, Box, Button, Grid, Typography } from '@mui/material';
import { Footer } from '@/components/Layout/Footer';
import { LayoutWrapper } from './layout-wrapper';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    // global-error must include html and body tags
    <html>
      <body>
        <LayoutWrapper>
          <UnauthenticatedMain sx={{ display: 'flex' }}>
            <ActionPaper
              sx={{
                mt: 'auto',
                px: 3,
                py: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="h1">Ooops!</Typography>
              <Typography variant="h2" sx={{ mt: 1.5 }}>
                Something went wrong!
              </Typography>

              <Alert severity="error" sx={{ my: 2 }}>
                {error.message || 'An unexpected error occurred.'}
              </Alert>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Button LinkComponent={NextLink} href="/" fullWidth>
                    Home
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Button onClick={() => reset()} fullWidth>
                    Try again
                  </Button>
                </Grid>
              </Grid>
            </ActionPaper>
            <Box sx={{ mt: 'auto' }} children={<Footer />} />
          </UnauthenticatedMain>
        </LayoutWrapper>
      </body>
    </html>
  );
}
