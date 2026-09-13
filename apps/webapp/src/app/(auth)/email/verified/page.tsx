import {Box, Card, Divider, Grid, Typography} from '@mui/material';
import {headers} from 'next/headers';
import {AppLogo} from '@/components/AppLogo';
import {LinkButton} from '@/components/Button';
import {ErrorAlert} from '@/components/ErrorAlert';
import {getAuth} from '@/lib/auth';

type AuthSession = ReturnType<typeof getAuth>['$Infer']['Session'];

export default async function MailVerifiedPage() {
  let session: AuthSession | null = null;
  let error: Error | null = null;
  try {
    session = await getAuth().api.getSession({headers: await headers()});
  } catch (cause) {
    error = cause instanceof Error ? cause : new Error(String(cause));
  }

  const isSignedIn = session !== null;
  const isEmailVerified = session?.user.emailVerified === true;

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
              Email Verification
            </Typography>
          </Box>

          {error && <ErrorAlert error={error} />}

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
