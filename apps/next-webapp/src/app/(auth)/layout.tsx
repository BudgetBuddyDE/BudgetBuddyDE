import React from 'react';
import { Box, Container } from '@mui/material';
import { Footer } from '@/components/Layout/Footer';
import { UnauthenticatedMain } from '@/components/Layout/Main';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <UnauthenticatedMain sx={{ position: 'relative' }}>
      <Container maxWidth="xl" sx={{ mt: 'auto', p: { xs: 2, md: 4 } }}>
        {children}
      </Container>
      <Box sx={{ mt: 'auto' }} children={<Footer />} />
    </UnauthenticatedMain>
  );
}
