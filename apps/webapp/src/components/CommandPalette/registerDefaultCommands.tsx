'use client';

import DashboardRounded from '@mui/icons-material/DashboardRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import VpnKeyRounded from '@mui/icons-material/VpnKeyRounded';
import {useRouter} from 'next/navigation';
import React from 'react';
import {signOut} from '@/authClient';
import {useSnackbarContext} from '@/components/Snackbar';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {type Command, useCommandPalette} from './CommandPaletteContext';

export const RegisterDefaultCommands: React.FC = () => {
  const t = useAppTranslations();
  const router = useRouter();
  const {register, unregister} = useCommandPalette();
  const {showSnackbar} = useSnackbarContext();

  React.useEffect(() => {
    const commands: Command[] = [
      {
        id: 'go-dashboard',
        label: t('commandPalette.openDashboard'),
        section: 'Navigation',
        icon: <DashboardRounded />,
        onSelect: () => router.push('/dashboard'),
      },
      {
        id: 'go-settings',
        label: t('commandPalette.openSettings'),
        section: 'Settings',
        icon: <SettingsRounded />,
        onSelect: () => router.push('/settings/profile'),
      },
      {
        id: 'go-api-keys',
        label: t('commandPalette.openAPIKeys'),
        section: 'Settings',
        icon: <VpnKeyRounded />,
        onSelect: () => router.push('/settings/api-keys'),
      },
      {
        id: 'logout',
        label: t('commandPalette.logout'),
        section: 'Session',
        icon: <LogoutRounded />,
        onSelect: async () => {
          await signOut(
            () => showSnackbar({message: t('commandPalette.youHaveBeenLoggedOut')}),
            () => showSnackbar({message: t('commandPalette.logoutFailedPleaseTryAgain')}),
          );
        },
      },
    ];
    register(commands);
    return () => unregister(commands.map(c => c.id));
  }, [register, unregister, router, showSnackbar, t]);

  return null;
};
