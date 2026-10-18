'use client';

import SendRounded from '@mui/icons-material/SendRounded';
import {Box, Button, Divider, Grid, Link, TextField, Typography} from '@mui/material';
import NextLink from 'next/link';
import {redirect, useRouter, useSearchParams} from 'next/navigation';
import {useFormStatus} from 'react-dom';
import {authClient} from '@/authClient';
import {Brand} from '@/components/Brand';
import {Card} from '@/components/Card';
import {PasswordInput} from '@/components/Form/PasswordInput';
import {useSnackbarContext} from '@/components/Snackbar';
import {type AuthProvider, SocialAuthButton} from '@/components/User/SocialAuthButton';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export default function SignInPage() {
  const t = useAppTranslations();
  const {showSnackbar} = useSnackbarContext();
  const {pending: isPending} = useFormStatus();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams?.get('email') || '';

  async function onSubmit(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    await authClient.signIn.email({
      email,
      password,
      fetchOptions: {
        onError: ctx => {
          showSnackbar({message: ctx.error.message});
          // Set email as query-param on errors
          const params = new URLSearchParams();
          if (email) {
            params.set('email', email);
          }
          router.push(`/sign-in?${params.toString()}`);
        },
        onSuccess: async () => {
          showSnackbar({
            message: t('auth.signIn.youHaveBeenSignedInYouReGettingRedirected'),
          });
          redirect('/dashboard');
        },
      },
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
              {t('auth.signIn.signIn')}
            </Typography>
          </Box>

          <form action={onSubmit}>
            <Grid container spacing={2} sx={{mt: 1}}>
              {(['google', 'github'] as AuthProvider[]).map(provider => (
                <Grid key={provider} size={{xs: 6}}>
                  <SocialAuthButton key={provider} provider={provider} disabled={isPending} />
                </Grid>
              ))}

              <Grid size={{xs: 12}}>
                <Divider>{t('auth.signIn.orWith')}</Divider>
              </Grid>

              <Grid size={{xs: 12}}>
                <TextField
                  variant="outlined"
                  placeholder={t('auth.signIn.enterEmail')}
                  type="email"
                  label={t('auth.signIn.eMail')}
                  name="email"
                  defaultValue={emailFromQuery}
                  disabled={isPending}
                  fullWidth
                  required
                />
              </Grid>

              <Grid size={{xs: 12}}>
                <PasswordInput />

                <Button
                  component={Link}
                  href="/password/request-reset"
                  tabIndex={-1}
                  variant="text"
                  size="small"
                  sx={{mt: 0.5}}
                >
                  {t('auth.signIn.forgotPassword')}
                </Button>
              </Grid>
            </Grid>
            <Box sx={{display: 'flex', justifyContent: 'center'}}>
              <Button type="submit" variant="contained" endIcon={<SendRounded />} sx={{mt: 1}} disabled={isPending}>
                {t('auth.signIn.signIn')}
              </Button>
            </Box>
          </form>

          <Divider sx={{my: 2}}>{t('auth.signIn.noAccount')}</Divider>

          <Button LinkComponent={NextLink} href="/sign-up" variant="contained" fullWidth>
            {t('auth.signIn.createAnAccount')}
          </Button>
        </Card>
      </Grid>
    </Grid>
  );
}
