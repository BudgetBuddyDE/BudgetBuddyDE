import {Box, Card, Divider, Grid, Typography} from '@mui/material';
import {headers} from 'next/headers';
import {authClient} from '@/authClient';
import {AppLogo} from '@/components/AppLogo';
import {LinkButton} from '@/components/Button';
import {ErrorAlert} from '@/components/ErrorAlert';

export default async function MailChangedPage() {
  const {data: session, error} = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  const isSignedIn = session !== null;

  return (
    <Grid
      container
      sx={{
        justifyContent: 'center',
      }}
    >
      <Grid size={{xs: 12, md: 4, xl: 3.5}}>
        <Card sx={{py: 3, px: 4}}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <AppLogo
              style={{
                marginLeft: 'auto',
                marginRight: 'auto',
                borderRadius: '5px',
              }}
              width={96}
              height={96}
            />

            <Typography
              variant={'h5'}
              sx={{
                textAlign: 'center',
                fontWeight: 'bolder',
                mt: 2,
              }}
            >
              Change of email address
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
              You have successfully changed your email address to {session.user.email}.
            </Typography>
          )}

          <Divider sx={{my: 2}}>Not signed in?</Divider>

          {isSignedIn && (
            <LinkButton href="/sign-in" variant="contained" fullWidth sx={{mb: 2}}>
              Sign in first...
            </LinkButton>
          )}

          <LinkButton href="/sign-up" variant="contained" fullWidth>
            Create an account
          </LinkButton>
        </Card>
      </Grid>
    </Grid>
  );
}
