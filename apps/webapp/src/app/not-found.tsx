import {Box, Button, Grid, Typography} from '@mui/material';
import NextLink from 'next/link';
import {ActionPaper} from '@/components/ActionPaper';
import {Footer} from '@/components/Layout/Footer';
import {UnauthenticatedMain} from '@/components/Layout/Main/UnauthenticatedMain';

export default function NotFoundPage() {
  return (
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
          Page Not Found
        </Typography>

        <Typography sx={{my: 1}}>The page you are looking for might have been removed or moved.</Typography>

        <Grid container spacing={2}>
          <Grid size={{xs: 12, md: 4}}>
            <Button LinkComponent={NextLink} href="/" fullWidth>
              Home
            </Button>
          </Grid>
          <Grid size={{xs: 12, md: 4}}>
            <Button LinkComponent={NextLink} href="/sign-in" fullWidth>
              Sign in
            </Button>
          </Grid>
          <Grid size={{xs: 12, md: 4}}>
            <Button LinkComponent={NextLink} href="/sign-up" fullWidth>
              Sign up
            </Button>
          </Grid>
        </Grid>
      </ActionPaper>
      <Box sx={{mt: 'auto'}}>
        <Footer />
      </Box>
    </UnauthenticatedMain>
  );
}
