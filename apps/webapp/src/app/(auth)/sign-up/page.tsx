'use client';

import SendRounded from '@mui/icons-material/SendRounded';
import {Box, Button, Checkbox, Divider, FormControlLabel, Grid, Link, TextField, Typography} from '@mui/material';
import NextLink from 'next/link';
import {redirect, useRouter, useSearchParams} from 'next/navigation';
import {useTranslations} from 'next-intl';
import React from 'react';
import {authClient} from '@/authClient';
import {Brand} from '@/components/Brand';
import {Card} from '@/components/Card';
import {PasswordInput} from '@/components/Form/PasswordInput';
import {useSnackbarContext} from '@/components/Snackbar';
import {type AuthProvider, SocialAuthButton} from '@/components/User/SocialAuthButton';

export default function SignUp() {
  const t = useTranslations('Auth');
  const {showSnackbar} = useSnackbarContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const nameFromQuery = searchParams?.get('name') || '';
  const surnameFromQuery = searchParams?.get('surname') || '';
  const emailFromQuery = searchParams?.get('email') || '';

  // Hilfsfunktion zum Setzen der Query-Parameter bei Fehlern
  const redirectWithFormData = (firstName: string, surname: string, email: string) => {
    const params = new URLSearchParams();
    if (firstName) params.set('name', firstName);
    if (surname) params.set('surname', surname);
    if (email) params.set('email', email);
    router.push(`/sign-up?${params.toString()}`);
  };

  async function onSubmit(formData: FormData) {
    const firstName = formData.get('name') as string;
    const surname = formData.get('surname') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');

    if (password !== confirmPassword) {
      showSnackbar({message: t('passwordsDoNotMatch')});
      redirectWithFormData(firstName, surname, email);
      return;
    }

    await authClient.signUp.email({
      name: `${firstName} ${surname}`,
      email,
      password: formData.get('password') as string,
      fetchOptions: {
        onError: ctx => {
          showSnackbar({message: ctx.error.message});
          redirectWithFormData(firstName, surname, email);
        },
        onSuccess: async () => {
          showSnackbar({
            message: t('signedUpRedirect'),
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
              {t('signUp')}
            </Typography>
          </Box>

          <form action={onSubmit}>
            <Grid container spacing={2} sx={{mt: 1}}>
              {(['google', 'github'] as AuthProvider[]).map(provider => (
                <Grid key={provider} size={{xs: 6}}>
                  <SocialAuthButton key={provider} provider={provider} />
                </Grid>
              ))}

              <Grid size={{xs: 12}}>
                <Divider>{t('orWith')}</Divider>
              </Grid>

              <Grid size={{xs: 6}}>
                <TextField
                  variant="outlined"
                  placeholder={t('name')}
                  type="text"
                  label={t('name')}
                  name="name"
                  defaultValue={nameFromQuery}
                  fullWidth
                  required
                />
              </Grid>

              <Grid size={{xs: 6}}>
                <TextField
                  variant="outlined"
                  placeholder={t('surname')}
                  type="text"
                  label={t('surname')}
                  name="surname"
                  defaultValue={surnameFromQuery}
                  fullWidth
                  required
                />
              </Grid>

              <Grid size={{xs: 12}}>
                <TextField
                  variant="outlined"
                  placeholder={t('enterEmail')}
                  type="email"
                  label={t('email')}
                  name="email"
                  defaultValue={emailFromQuery}
                  fullWidth
                  required
                />
              </Grid>

              <Grid size={{xs: 12}}>
                <PasswordInput />
              </Grid>

              <Grid size={{xs: 12}}>
                <PasswordInput
                  outlinedInputProps={{
                    label: t('confirmPassword'),
                    name: 'confirm-password',
                  }}
                />
              </Grid>

              <Grid size={{xs: 12}}>
                <FormControlLabel
                  required
                  control={<Checkbox />}
                  label={
                    <React.Fragment>
                      {t('accept')}{' '}
                      <Link href={'https://budget-buddy.de/tos'} target="_blank">
                        {t('termsOfService')}
                      </Link>
                    </React.Fragment>
                  }
                  sx={{mt: 1}}
                />
              </Grid>
            </Grid>

            <Box sx={{display: 'flex', justifyContent: 'center'}}>
              <Button
                type="submit"
                variant="contained"
                endIcon={<SendRounded />}
                sx={{mt: 1}}
                data-umami-event={'default-sign-up'}
              >
                {t('signUp')}
              </Button>
            </Box>
          </form>

          <Divider sx={{my: 2}}>{t('alreadyRegistered')}</Divider>

          <Button LinkComponent={NextLink} href="/sign-in" variant="contained" fullWidth>
            {t('signIn')}
          </Button>
        </Card>
      </Grid>
    </Grid>
  );
}
