import {AppRegistrationRounded, ExitToAppRounded, HomeRounded, SendRounded} from '@mui/icons-material';
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
import {useLocation, useNavigate} from 'react-router-dom';
import {Link as RouterLink} from 'react-router-dom';

import {AppConfig} from '@/app.config.ts';
import {authClient} from '@/auth';
import {AppLogo} from '@/components/AppLogo/AppLogo.component';
import {Card} from '@/components/Base/Card';
import {PasswordInput} from '@/components/Base/Input';
import {withUnauthentificatedLayout} from '@/features/Auth';
import {SocialSignInBtn, useAuthContext} from '@/features/Auth';
import {useSnackbarContext} from '@/features/Snackbar';

const SignIn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {session, revalidateSession, logout} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const [form, setForm] = React.useState<Record<string, string>>({
    // FIXME: Remove default values in production
    email: 'john.doe@example.com',
    password: 'password123',
    rememberMe: 'true',
  });

  const redirectToDashboard = () => {
    navigate('/dashboard');
  };

  const handleSuccessfullLogin = (name: string) => {
    showSnackbar({message: `Welcome ${name}!`, action: <Button onClick={logout}>Sign-out</Button>});
    if (location.search) {
      const query = new URLSearchParams(location.search.substring(1));
      if (query.get('callbackUrl')) navigate(query.get('callbackUrl')!);
      return;
    }
    navigate('/');
  };

  const formHandler = {
    inputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({...prev, [event.target.name]: event.target.value}));
    },
    handleAuthProviderLogin: (response: RecordAuthResponse<RecordModel>) => {
      handleSuccessfullLogin(response.record.username);
    },
    formSubmit: async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const result = await authClient.signIn.email({
        email: form.email,
        password: form.password,
        rememberMe: form.rememberMe === 'true',
      });
      if (result.error) {
        showSnackbar({
          message: result.error.message || 'Login failed',
          action: <Button onClick={() => formHandler.formSubmit(event)}>Try again</Button>,
        });
        return;
      }
      showSnackbar({
        message: 'You have successfully logged in!',
        action: <Button onClick={async () => await logout()}>Sign out</Button>,
      });
      await revalidateSession();
      navigate('/dashboard');
    },
  };

  return (
    <React.Fragment>
      {session && (
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

              <Typography variant={'h5'} textAlign={'center'} fontWeight={'bolder'} sx={{mt: 2}}>
                {session ? `Welcome ${session.user?.name}!` : 'Sign in'}
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
                      data-umami-event={'social-sign-in'}
                      data-umami-value={provider}
                    />
                  </Grid>
                ))}

                <Grid size={{xs: 12}}>
                  <Divider>or with</Divider>
                </Grid>

                <Grid size={{xs: 12}}>
                  <TextField
                    variant="outlined"
                    placeholder="Enter email"
                    type="email"
                    label="E-Mail"
                    name="email"
                    onChange={formHandler.inputChange}
                    defaultValue={form.email}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid size={{xs: 12}}>
                  <PasswordInput
                    outlinedInputProps={{onChange: formHandler.inputChange, defaultValue: form.password}}
                  />

                  <Link
                    tabIndex={-1}
                    variant="caption"
                    href="/request-password-reset"
                    sx={{textDecoration: 'none', mt: 0.5}}
                    component={Button}>
                    Forgot password?
                  </Link>
                </Grid>

                <Grid size={{xs: 12}}>
                  <FormControlLabel
                    defaultChecked={form.rememberMe === 'true'}
                    control={<Checkbox />}
                    label={<React.Fragment>Remember me?</React.Fragment>}
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
                  data-umami-event={'default-sign-in'}>
                  Sign in
                </Button>
              </Box>
            </form>

            <Divider sx={{my: 2}} data-umami-event={'sign-in-no-account'}>
              No account?
            </Divider>

            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/*@ts-expect-error*/}
            <Button
              LinkComponent={RouterLink}
              to={'/sign-up'}
              variant={'contained'}
              size={'large'}
              startIcon={<AppRegistrationRounded />}
              fullWidth
              data-umami-event={'sign-in-redirect-register'}>
              Sign up
            </Button>
          </Card>
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default withUnauthentificatedLayout(SignIn);
