import React from 'react';
import { Box, Container } from '@mui/material';
import { Footer } from '@/components/Layout/Footer';
import { AuthenticatedMain } from '@/components/Layout/Main';
import { AppBar } from '@/components/Layout/AppBar';
import { Drawer } from '@/components/Layout/Drawer';
import {
  CommandPalette,
  CommandPaletteProvider,
  RegisterDefaultCommands,
} from '@/components/CommandPalette';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer />

      <AuthenticatedMain
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          overflow: 'auto',
          height: '100vh',
          backgroundColor: 'theme.palette.background.default',
        }}
      >
        <AppBar />

        <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
          <CommandPaletteProvider>
            <RegisterDefaultCommands />
            {children}
            <CommandPalette />
          </CommandPaletteProvider>
        </Container>

        <Box sx={{ mt: 'auto' }} children={<Footer />} />
      </AuthenticatedMain>
    </Box>
  );
}
