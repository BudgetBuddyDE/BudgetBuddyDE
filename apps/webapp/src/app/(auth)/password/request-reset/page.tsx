'use client';

import SendRounded from '@mui/icons-material/SendRounded';
import {Box, Button, Divider, Grid, TextField, Typography} from '@mui/material';
import NextLink from 'next/link';
import {useSearchParams} from 'next/navigation';
import {useFormStatus} from 'react-dom';
import {authClient} from '@/authClient';
import {Brand} from '@/components/Brand';
import {Card} from '@/components/Card';
import {useSnackbarContext} from '@/components/Snackbar';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export default function RequestPasswordResetPage() {
  const t = useAppTranslations();
  const {showSnackbar} = useSnackbarContext();
  const {pending: isPending} = useFormStatus();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams?.get('email') || '';

  async function onSubmit(formData: FormData) {
    const email = formData.get('email') as string;

    await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/password/reset`,
    });

    showSnackbar({
      message: t('auth.auth.ifAnAccountWithThatEmailExistsAPasswordResetLinkHasBeenSentCheckYourInbox'),
    });
  }

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
              {t('auth.auth.requestPasswordReset')}
            </Typography>
          </Box>

          <form action={onSubmit}>
            <Grid container spacing={2} sx={{mt: 1}}>
              <Grid size={{xs: 12}}>
                <TextField
                  variant="outlined"
                  placeholder={t('auth.auth.enterEmail')}
                  type="email"
                  label={t('auth.auth.eMail')}
                  name="email"
                  defaultValue={emailFromQuery}
                  disabled={isPending}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>
            <Box sx={{display: 'flex', justifyContent: 'center'}}>
              <Button type="submit" variant="contained" endIcon={<SendRounded />} sx={{mt: 1}} disabled={isPending}>
                {t('auth.auth.submitRequest')}
              </Button>
            </Box>
          </form>

          <Divider sx={{my: 2}}>{t('auth.auth.or')}</Divider>

          <Button LinkComponent={NextLink} href="/sign-in" variant="contained" fullWidth sx={{mb: 2}}>
            {t('auth.auth.signIn')}
          </Button>

          <Button LinkComponent={NextLink} href="/sign-up" variant="contained" fullWidth>
            {t('auth.auth.createAnAccount')}
          </Button>
        </Card>
      </Grid>
    </Grid>
  );
}
