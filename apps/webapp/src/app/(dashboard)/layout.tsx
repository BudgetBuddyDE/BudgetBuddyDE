import {Box, Container} from '@mui/material';
import type React from 'react';
import {CommandPalette, CommandPaletteProvider, RegisterDefaultCommands} from '@/components/CommandPalette';
import {AppBar} from '@/components/Layout/AppBar';
import {Drawer, DrawerProvider} from '@/components/Layout/Drawer';
import {Footer} from '@/components/Layout/Footer';
import {AuthenticatedMain} from '@/components/Layout/Main';

export default function Layout({children}: React.PropsWithChildren) {
  return (
    <Box sx={{display: 'flex'}}>
      <DrawerProvider>
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

          <Container maxWidth="xl" sx={{mt: 2, mb: 4}}>
            <CommandPaletteProvider>
              <RegisterDefaultCommands />
              {children}
              <CommandPalette />
            </CommandPaletteProvider>
          </Container>

          <Box sx={{mt: 'auto'}}>
            <Footer />
          </Box>
        </AuthenticatedMain>
      </DrawerProvider>
    </Box>
  );
}
