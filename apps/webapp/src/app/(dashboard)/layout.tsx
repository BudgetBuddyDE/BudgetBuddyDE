import {Box, Container} from '@mui/material';
import {cookies, headers} from 'next/headers';
import type React from 'react';
import {apiClient} from '@/apiClient';
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
import {normalizeLocale} from '@/i18n/config';
import messages from '@/messages/en-US.json';
import {LayoutWrapper} from '../layout-wrapper';

export default async function Layout({children}: React.PropsWithChildren) {
  const [preferenceResult, preferenceError] = await apiClient.backend.preference.get({
    headers: await headers(),
    cache: 'no-store',
  });
  if (preferenceError) throw preferenceError;
  const locale = normalizeLocale(preferenceResult.data.language);
  const cookieStore = await cookies();
  const selectedCurrency = cookieStore.get('budgetbuddy-currency')?.value;
  const currency = selectedCurrency === 'USD' ? 'USD' : preferenceResult.data.currency === 'USD' ? 'USD' : 'EUR';
  const persistedDrawerState = cookieStore.get('budgetbuddy-drawer-state')?.value;
  const hasPersistedDrawerState = persistedDrawerState === 'shown' || persistedDrawerState === 'hidden';
  const initialDrawerState = persistedDrawerState === 'hidden' ? 'hidden' : 'shown';

  return (
    <LayoutWrapper locale={locale} messages={messages} currency={currency}>
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
    </LayoutWrapper>
  );
}
