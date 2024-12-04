import {Box, Container, styled} from '@mui/material';
import React from 'react';

import {CookieDisclaimer} from '@/components/CookieDisclaimer';
import {EnvironmentDisclaimer} from '@/components/EnvironmentDisclaimer';
import {Footer} from '@/components/Layout';

const Main = styled('main')(() => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  justifyContent: 'center',
  alignItems: 'center',
}));

export type TUnauthentificatedLayout = React.PropsWithChildren;

export const UnauthentificatedLayout: React.FC<TUnauthentificatedLayout> = ({children}) => {
  return (
    <Main sx={{position: 'relative'}}>
      <EnvironmentDisclaimer sx={{width: '100%'}} />
      <Container maxWidth="xl" sx={{mt: 'auto', p: {xs: 2, md: 4}}}>
        {children}
      </Container>
      <Box sx={{mt: 'auto'}} children={<Footer />} />
      <CookieDisclaimer />
    </Main>
  );
};

export function withUnauthentificatedLayout<P extends object>(Component: React.ComponentType<P>) {
  return function WrappedComponent(props: P) {
    return (
      <UnauthentificatedLayout>
        <Component {...props} />
      </UnauthentificatedLayout>
    );
  };
}
