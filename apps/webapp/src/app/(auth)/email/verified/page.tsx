import {Box, Button, Card, Divider, Grid, Typography} from '@mui/material';
import {headers} from 'next/headers';
import NextLink from 'next/link';
import {authClient} from '@/authClient';
import {AppLogo} from '@/components/AppLogo';
import {ErrorAlert} from '@/components/ErrorAlert';

export default async function MailVerifiedPage() {
  const {data: session, error} = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  const isSignedIn = session !== null;
  const isEmailVerified = session?.user.emailVerified === true;

  return (
    <Grid container justifyContent="center">
      <Grid size={{xs: 12, md: 4, xl: 3.5}}>
        <Card sx={{py: 3, px: 4}}>
          <Box display="flex" flexDirection="column">
            <AppLogo
              style={{
                marginLeft: 'auto',
                marginRight: 'auto',
                borderRadius: '5px',
              }}
              width={96}
              height={96}
            />

            <Typography variant={'h5'} textAlign={'center'} fontWeight={'bolder'} sx={{mt: 2}}>
              Email Verification
            </Typography>
          </Box>

          {error && <ErrorAlert error={new Error(error.message)} />}

          {!isSignedIn && (
            <Typography variant="body1" gutterBottom>
              It seems like you are not signed in. Please sign in first...
            </Typography>
          )}

          {isSignedIn && (
            <Typography variant="body1" gutterBottom>
              {isEmailVerified
                ? 'Thank you for verifying your email address. You can now access all features of Budget Buddy. You can close this page and continue to the dashboard.'
                : 'There was an issue verifying your email address. Please try again or contact support if the issue persists.'}
            </Typography>
          )}

          <Divider sx={{my: 2}}>Not signed in?</Divider>

          {isSignedIn && (
            <Button LinkComponent={NextLink} href="/sign-in" variant="contained" fullWidth sx={{mb: 2}}>
              Sign in first...
            </Button>
          )}

          <Button LinkComponent={NextLink} href="/sign-up" variant="contained" fullWidth>
            Create an account
          </Button>
        </Card>
      </Grid>
    </Grid>
  );
}
