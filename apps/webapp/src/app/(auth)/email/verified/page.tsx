import {Box, Card, Divider, Grid, Typography} from '@mui/material';
import {headers} from 'next/headers';
import {getTranslations} from 'next-intl/server';
import {authClient} from '@/authClient';
import {Brand} from '@/components/Brand';
import {LinkButton} from '@/components/Button';
import {ErrorAlert} from '@/components/ErrorAlert';

export default async function MailVerifiedPage() {
  const t = await getTranslations('EmailConfirmation');
  const {data: session, error} = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

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
            <Brand logoSize={96} logoStyle={{borderRadius: '5px'}} boxStyle={{mx: 'auto'}} />

            <Typography
              variant={'h5'}
              sx={{
                textAlign: 'center',
                fontWeight: 'bolder',
                mt: 2,
              }}
            >
              {t('verificationTitle')}
            </Typography>
          </Box>

          {error && <ErrorAlert error={new Error(error.message)} />}

          {!isSignedIn && (
            <Typography variant="body1" gutterBottom>
              {t('notSignedInMessage')}
            </Typography>
          )}

          {isSignedIn && (
            <Typography variant="body1" gutterBottom>
              {isEmailVerified ? t('verifiedMessage') : t('verificationFailed')}
            </Typography>
          )}

          <Divider sx={{my: 2}}>{t('notSignedIn')}</Divider>

          {isSignedIn && (
            <LinkButton href="/sign-in" variant="contained" fullWidth sx={{mb: 2}}>
              {t('signInFirst')}
            </LinkButton>
          )}

          <LinkButton href="/sign-up" variant="contained" fullWidth>
            {t('createAccount')}
          </LinkButton>
        </Card>
      </Grid>
    </Grid>
  );
}
