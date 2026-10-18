import {Box, Card, Divider, Grid, Typography} from '@mui/material';
import {headers} from 'next/headers';
import {authClient} from '@/authClient';
import {Brand} from '@/components/Brand';
import {LinkButton} from '@/components/Button';
import {ErrorAlert} from '@/components/ErrorAlert';
import {getAppTranslations} from '@/i18n/server';

export default async function MailChangedPage() {
  const t = await getAppTranslations();
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
            <Brand logoSize={96} logoStyle={{borderRadius: '5px'}} boxStyle={{mx: 'auto'}} />

            <Typography
              variant={'h5'}
              sx={{
                textAlign: 'center',
                fontWeight: 'bolder',
                mt: 2,
              }}
            >
              {t('auth.email.changeOfEmailAddress')}
            </Typography>
          </Box>

          {error && <ErrorAlert error={new Error(error.message)} />}

          {!isSignedIn && (
            <Typography variant="body1" gutterBottom>
              {t('auth.email.itSeemsLikeYouAreNotSignedInPleaseSignInFirst')}
            </Typography>
          )}

          {isSignedIn && (
            <Typography variant="body1" gutterBottom>
              {t('auth.email.youHaveSuccessfullyChangedYourEmailAddressToEmail', {email: session.user.email})}
            </Typography>
          )}

          <Divider sx={{my: 2}}>{t('auth.email.notSignedIn')}</Divider>

          {isSignedIn && (
            <LinkButton href="/sign-in" variant="contained" fullWidth sx={{mb: 2}}>
              {t('auth.email.signInFirst')}
            </LinkButton>
          )}

          <LinkButton href="/sign-up" variant="contained" fullWidth>
            {t('auth.email.createAnAccount')}
          </LinkButton>
        </Card>
      </Grid>
    </Grid>
  );
}
