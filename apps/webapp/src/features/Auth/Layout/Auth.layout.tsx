import {Box, Container, styled} from '@mui/material';
import React from 'react';

import {CookieDisclaimer} from '@/components/CookieDisclaimer';
import {EnvironmentDisclaimer} from '@/components/EnvironmentDisclaimer';
import {FilterDrawer} from '@/components/Filter';
import {AppBar, Footer} from '@/components/Layout';
import {Drawer} from '@/components/Layout/Drawer';
import {AccountDeletionAlert} from '@/components/Settings/AccountDeletionAlert.component';
import {useTransactions} from '@/features/Transaction';

import {useAuthContext} from '../Auth.context';

const Main = styled('main')(({theme}) => ({
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.down('sm')]: {
    marginLeft: 0,
  },
}));

export type TAuthLayout = React.PropsWithChildren;

export const AuthLayout: React.FC<TAuthLayout> = ({children}) => {
  const {session: sessionUser} = useAuthContext();
  const {refreshDataWithFilter, refreshData} = useTransactions();

  return (
    <Box sx={{display: 'flex'}}>
      <Drawer />
      <Main
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          overflow: 'auto',
          height: '100vh',
          backgroundColor: theme => theme.palette.background.default,
        }}>
        <EnvironmentDisclaimer />

        <AppBar />

        <Container maxWidth="xl" sx={{mt: 2, mb: 4}}>
          {sessionUser && sessionUser.marked_for_deletion && <AccountDeletionAlert sx={{mb: 2}} />}
          {children}
        </Container>

        <Box sx={{mt: 'auto'}} children={<Footer />} />
        <CookieDisclaimer />
      </Main>

      <FilterDrawer
        // TODO: Needs some re-work
        onFilterChange={async filter => {
          if (refreshDataWithFilter) {
            await refreshDataWithFilter(true, filter);
          } else await refreshData(true);
        }}
      />
    </Box>
  );
};
