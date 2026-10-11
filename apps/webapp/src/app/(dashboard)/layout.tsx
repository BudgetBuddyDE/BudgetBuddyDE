import {Box, Container} from '@mui/material';
import {cookies} from 'next/headers';
import type React from 'react';
import {
  CommandPalette,
  CommandPaletteProvider,
  RegisterDefaultCommands,
  RegisterIntentCommands,
} from '@/components/CommandPalette';
import {AppBar} from '@/components/Layout/AppBar';
import {Drawer, DrawerProvider} from '@/components/Layout/Drawer';
import {Footer} from '@/components/Layout/Footer';
import {AuthenticatedMain} from '@/components/Layout/Main';
import {RouteTransition} from '@/components/Layout/RouteTransition';

export default async function Layout({children}: React.PropsWithChildren) {
  const cookieStore = await cookies();
  const persistedDrawerState = cookieStore.get('budgetbuddy-drawer-state')?.value;
  const hasPersistedDrawerState = persistedDrawerState === 'shown' || persistedDrawerState === 'hidden';
  const initialDrawerState = persistedDrawerState === 'hidden' ? 'hidden' : 'shown';

  return (
    <Box sx={{display: 'flex'}}>
      <DrawerProvider initialState={initialDrawerState} hasPersistedState={hasPersistedDrawerState}>
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

          <Container maxWidth="xl" sx={{mt: 2, mb: 4, scrollbarGutter: 'stable'}}>
            <CommandPaletteProvider>
              <RegisterDefaultCommands />
              <RegisterIntentCommands />
              <RouteTransition>{children}</RouteTransition>
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
