'use client';

import SendRounded from '@mui/icons-material/SendRounded';
import {Box, Button, Divider, Grid, Typography} from '@mui/material';
import NextLink from 'next/link';
import {redirect, useSearchParams} from 'next/navigation';
import {authClient} from '@/authClient';
import {Brand} from '@/components/Brand';
import {Card} from '@/components/Card';
import {PasswordInput} from '@/components/Form/PasswordInput';
import {useSnackbarContext} from '@/components/Snackbar';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export default function ResetPasswordPage() {
  const t = useAppTranslations();
  const {showSnackbar} = useSnackbarContext();
  const searchParams = useSearchParams();

  async function onSubmit(formData: FormData) {
    const token = searchParams.get('token');
    if (!token) {
      showSnackbar({
        message: t('auth.auth.noPasswordResetTokenFoundInYourURL'),
        action: (
          <Button LinkComponent={NextLink} href="/password/request-reset">
            {t('auth.auth.restartProcess')}
          </Button>
        ),
      });
      return;
    }

    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');

    if (password !== confirmPassword) {
      showSnackbar({message: t('auth.auth.passwordsDoNotMatch')});
      return;
    }

    await authClient.resetPassword({
      newPassword: password as string,
      token,
    });

    showSnackbar({
      message: t('auth.auth.yourPasswordHasBeenResetYouCanNowSignIn'),
    });
    redirect('/sign-in');
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
              {t('auth.auth.resetPassword')}
            </Typography>
          </Box>

          <form action={onSubmit}>
            <Grid container spacing={2} sx={{mt: 1}}>
              <Grid size={{xs: 12}}>
                <PasswordInput />
              </Grid>

              <Grid size={{xs: 12}}>
                <PasswordInput
                  outlinedInputProps={{
                    label: t('auth.auth.confirmPassword'),
                    name: 'confirm-password',
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{display: 'flex', justifyContent: 'center'}}>
              <Button type="submit" variant="contained" endIcon={<SendRounded />} sx={{mt: 1}}>
                {t('auth.auth.saveNewPassword')}
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
