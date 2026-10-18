import {Box, Container} from '@mui/material';
import {cookies} from 'next/headers';
import type React from 'react';
import {
  CommandPalette,
  CommandPaletteProvider,
  RegisterDefaultCommands,
  RegisterIntentCommands,
} from '@/components/CommandPalette';
import {PreferencesI18nProvider} from '@/components/I18n/PreferencesI18nProvider';
import {AppBar} from '@/components/Layout/AppBar';
import {Drawer, DrawerProvider} from '@/components/Layout/Drawer';
import {Footer} from '@/components/Layout/Footer';
import {AuthenticatedMain} from '@/components/Layout/Main';
import {PreferencesProvider} from '@/components/Preferences/PreferencesProvider';
import {englishMessages} from '@/lib/i18n/messages';
import {getPreferences} from '@/lib/preferences/getPreferences';

export default async function Layout({children}: React.PropsWithChildren) {
  const cookieStore = await cookies();
  const [preferenceResponse, preferenceError] = await getPreferences();
  const persistedDrawerState = cookieStore.get('budgetbuddy-drawer-state')?.value;
  const hasPersistedDrawerState = persistedDrawerState === 'shown' || persistedDrawerState === 'hidden';
  const initialDrawerState = persistedDrawerState === 'hidden' ? 'hidden' : 'shown';

  return (
    <PreferencesProvider
      initialPreferences={preferenceResponse?.data ?? null}
      initialError={preferenceError?.message ?? null}
    >
      <PreferencesI18nProvider initialLanguage={preferenceResponse?.data.language} messages={englishMessages}>
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
      </PreferencesI18nProvider>
    </PreferencesProvider>
  );
}
