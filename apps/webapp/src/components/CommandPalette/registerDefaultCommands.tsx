'use client';

import DashboardRounded from '@mui/icons-material/DashboardRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import VpnKeyRounded from '@mui/icons-material/VpnKeyRounded';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';
import React from 'react';
import {signOut} from '@/authClient';
import {useSnackbarContext} from '@/components/Snackbar';
import {type Command, useCommandPalette} from './CommandPaletteContext';

export const RegisterDefaultCommands: React.FC = () => {
  const t = useTranslations('CommandPalette');
  const router = useRouter();
  const {register, unregister} = useCommandPalette();
  const {showSnackbar} = useSnackbarContext();

  React.useEffect(() => {
    const commands: Command[] = [
      {
        id: 'go-dashboard',
        label: t('openDashboard'),
        section: t('navigationSection'),
        icon: <DashboardRounded />,
        onSelect: () => router.push('/dashboard'),
      },
      {
        id: 'go-settings',
        label: t('openSettings'),
        section: t('settingsSection'),
        icon: <SettingsRounded />,
        onSelect: () => router.push('/settings/profile'),
      },
      {
        id: 'go-api-keys',
        label: t('openApiKeys'),
        section: t('settingsSection'),
        icon: <VpnKeyRounded />,
        onSelect: () => router.push('/settings/api-keys'),
      },
      {
        id: 'logout',
        label: t('logout'),
        section: t('sessionSection'),
        icon: <LogoutRounded />,
        onSelect: async () => {
          await signOut(
            () => showSnackbar({message: t('loggedOut')}),
            () => showSnackbar({message: t('logoutFailed')}),
          );
        },
      },
    ];
    register(commands);
    return () => unregister(commands.map(c => c.id));
  }, [register, unregister, router, showSnackbar, t]);

  return null;
};
