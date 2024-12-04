import {PocketBaseCollection} from '@budgetbuddyde/types';
import {AppRegistrationRounded, ExitToAppRounded, SendRounded} from '@mui/icons-material';
import {Box, Button, CircularProgress, Divider, Grid2 as Grid, Typography} from '@mui/material';
import React from 'react';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import {z} from 'zod';

import {AppLogo} from '@/components/AppLogo/AppLogo.component';
import {Card} from '@/components/Base/Card';
import {PasswordInput} from '@/components/Base/Input';
import {withUnauthentificatedLayout} from '@/features/Auth';
import {useAuthContext} from '@/features/Auth';
import {useSnackbarContext} from '@/features/Snackbar';
import {pb} from '@/pocketbase';

const ZPassword = z.string().min(8, 'The password needs to fullfill a minimum of 8 characters').max(64);

const ResetPassword = () => {
  const navigate = useNavigate();
  const {sessionUser, logout} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    pwd1: '',
    pwd2: '',
  });
  const searchParams = React.useMemo(() => new URLSearchParams(window.location.search), [window.location.search]);
  const otp: string | null = React.useMemo(() => {
    if (searchParams.has('code')) {
      return searchParams.get('code') as string;
    } else return null;
  }, [searchParams]);
  const handler = {
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({...prev, [e.target.name]: e.target.value}));
    },
    onSubmit: async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      try {
        if (!otp) throw new Error('No OTP provided');
        if (ZPassword.parse(form.pwd1) !== ZPassword.parse(form.pwd2)) {
          throw new Error('Passwords do not match');
        }
        setLoading(true);

        await pb.collection(PocketBaseCollection.USERS).confirmPasswordReset(otp, form.pwd1, form.pwd2);
        showSnackbar({message: 'Your password has been reset. Please sign in with your new password.'});
        navigate('/sign-in');
      } catch (error) {
        console.error(error);
        showSnackbar({
          message: (error as Error).message,
          action: (
            <Button size="small" onClick={() => handler.onSubmit(e)}>
              Retry
            </Button>
          ),
        });
      }
      setLoading(false);
    },
  };

  return (
    <React.Fragment>
      {sessionUser && (
        <Button
          sx={{position: 'absolute', top: theme => theme.spacing(2), right: theme => theme.spacing(2)}}
          startIcon={<ExitToAppRounded />}
          onClick={logout}>
          Sign out
        </Button>
      )}
      <Card
        sx={{
          width: {xs: '90%', md: '40%', lg: '30%', xl: '25%'},
          maxWidth: '480px',
          mx: 'auto',
          px: 4,
          py: 2,
          textAlign: 'center',
        }}>
        <Card.Header sx={{display: 'flex', flexDirection: 'column'}}>
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
            Request your password
          </Typography>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handler.onSubmit}>
            <Grid container spacing={2} sx={{mt: 1}}>
              <Grid size={{xs: 12}}>
                <PasswordInput outlinedInputProps={{name: 'pwd1', onChange: handler.onInputChange}} />
              </Grid>

              <Grid size={{xs: 12}}>
                <PasswordInput outlinedInputProps={{name: 'pwd2', onChange: handler.onInputChange}} />
              </Grid>
            </Grid>

            <Box sx={{display: 'flex', justifyContent: 'center'}}>
              <Button
                type="submit"
                variant="contained"
                endIcon={loading ? <CircularProgress size={18} color="primary" /> : <SendRounded />}
                disabled={loading}
                sx={{mt: 2}}>
                Reset password
              </Button>
            </Box>

            <Divider sx={{my: 2}}>Other options</Divider>

            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/*@ts-expect-error*/}
            <Button
              LinkComponent={RouterLink}
              to={'/sign-in'}
              size={'large'}
              startIcon={<SendRounded />}
              sx={{mb: 1}}
              fullWidth>
              Sign in
            </Button>

            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/*@ts-expect-error*/}
            <Button
              LinkComponent={RouterLink}
              to={'/sign-up'}
              size={'large'}
              startIcon={<AppRegistrationRounded />}
              fullWidth>
              Sign up
            </Button>
          </form>
        </Card.Body>
      </Card>
    </React.Fragment>
  );
};

export default withUnauthentificatedLayout(ResetPassword);
