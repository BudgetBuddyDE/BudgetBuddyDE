import {PocketBaseCollection} from '@budgetbuddyde/types';
import {ExitToAppRounded, HomeRounded, SendRounded} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid2 as Grid,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {type RecordAuthResponse, type RecordModel} from 'pocketbase';
import React from 'react';
import {Link as RouterLink, useNavigate} from 'react-router-dom';

import {AppConfig} from '@/app.config';
import {AppLogo} from '@/components/AppLogo/AppLogo.component';
import {Card} from '@/components/Base/Card';
import {PasswordInput} from '@/components/Base/Input';
import {withUnauthentificatedLayout} from '@/features/Auth';
import {SocialSignInBtn, useAuthContext} from '@/features/Auth';
import {useSnackbarContext} from '@/features/Snackbar';
import {pb} from '@/pocketbase.ts';

const SignUp = () => {
  const navigate = useNavigate();
  const {sessionUser, logout} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const [form, setForm] = React.useState<Record<string, string>>({});

  const redirectToDashboard = () => {
    navigate('/dashboard');
  };

  const formHandler = {
    inputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({...prev, [event.target.name]: event.target.value}));
    },
    handleAuthProviderLogin: (response: RecordAuthResponse<RecordModel>) => {
      showSnackbar({message: `Welcome ${response.record.username}!`});
      navigate('/');
    },
    formSubmit: async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        const data = {
          username: `${form.name}_${form.surname}`.replaceAll(' ', '_').toLowerCase(),
          email: form.email,
          emailVisibility: false,
          password: form.password,
          passwordConfirm: form.password,
          name: form.name,
          surname: form.surname,
        };
        await pb.collection(PocketBaseCollection.USERS).create(data);

        pb.collection(PocketBaseCollection.USERS).requestVerification(form.email);

        await pb.collection(PocketBaseCollection.USERS).authWithPassword(form.email, form.password);

        showSnackbar({message: 'You have successfully registered and signed in!'});
        navigate('/');
      } catch (error) {
        console.error(error);
        showSnackbar({message: (error as Error).message || 'Registration failed'});
      }
    },
  };

  return (
    <React.Fragment>
      {sessionUser && (
        <Stack
          flexDirection={'row'}
          sx={{position: 'absolute', top: theme => theme.spacing(2), right: theme => theme.spacing(2)}}
          gap={AppConfig.baseSpacing}>
          <Button startIcon={<HomeRounded />} onClick={redirectToDashboard}>
            Dashboard
          </Button>

          <Button startIcon={<ExitToAppRounded />} onClick={logout}>
            Sign out
          </Button>
        </Stack>
      )}
      <Grid container justifyContent={'center'}>
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

              <Typography variant={'h4'} textAlign={'center'} fontWeight={'bolder'} sx={{mt: 2}}>
                Sign up
              </Typography>
            </Box>

            <form onSubmit={formHandler.formSubmit}>
              <Grid container spacing={AppConfig.baseSpacing} sx={{mt: 1}}>
                {Object.keys(AppConfig.authProvider).map(provider => (
                  <Grid key={provider} size={{xs: 6}}>
                    <SocialSignInBtn
                      key={provider}
                      provider={provider}
                      onAuthProviderResponse={formHandler.handleAuthProviderLogin}
                      data-umami-event={'social-sign-up'}
                      data-umami-value={provider}
                    />
                  </Grid>
                ))}

                <Grid size={{xs: 12}}>
                  <Divider>or with</Divider>
                </Grid>

                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    variant="outlined"
                    label="Name"
                    name="name"
                    onChange={formHandler.inputChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    variant="outlined"
                    label="Surname"
                    name="surname"
                    onChange={formHandler.inputChange}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid size={{xs: 12}}>
                  <TextField
                    variant="outlined"
                    type="email"
                    label="E-Mail"
                    name="email"
                    onChange={formHandler.inputChange}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid size={{xs: 12}}>
                  <PasswordInput outlinedInputProps={{onChange: formHandler.inputChange}} />
                </Grid>

                <Grid size={{xs: 12}}>
                  <FormControlLabel
                    required
                    control={<Checkbox />}
                    label={
                      <React.Fragment>
                        I accept the{' '}
                        <Link href={AppConfig.website + '/tos'} target="_blank">
                          Terms of Service
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
                  data-umami-event={'default-sign-up'}>
                  Sign up
                </Button>
              </Box>
            </form>

            <Divider sx={{my: 2}}>Already registered?</Divider>

            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/*@ts-expect-error*/}
            <Button
              LinkComponent={RouterLink}
              to={'/sign-in'}
              variant={'contained'}
              size={'large'}
              startIcon={<SendRounded />}
              fullWidth
              data-umami-event={'sign-up-redirect-login'}>
              Sign in
            </Button>
          </Card>
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default withUnauthentificatedLayout(SignUp);
