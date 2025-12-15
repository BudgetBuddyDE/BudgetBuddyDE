'use client';

import {DashboardRounded, LogoutRounded, SettingsRounded} from '@mui/icons-material';
import {useRouter} from 'next/navigation';
import React from 'react';
import {signOut} from '@/authClient';
import {useSnackbarContext} from '@/components/Snackbar';
import {type Command, useCommandPalette} from './CommandPaletteContext';

export const RegisterDefaultCommands: React.FC = () => {
  const router = useRouter();
  const {register, unregister} = useCommandPalette();
  const {showSnackbar} = useSnackbarContext();

  React.useEffect(() => {
    const commands: Command[] = [
      {
        id: 'go-dashboard',
        label: 'Open Dashboard',
        section: 'Navigation',
        icon: <DashboardRounded />,
        onSelect: () => router.push('/dashboard'),
      },
      {
        id: 'go-settings',
        label: 'Open Settings',
        section: 'Navigation',
        icon: <SettingsRounded />,
        onSelect: () => router.push('/settings/profile'),
      },
      {
        id: 'logout',
        label: 'Logout',
        section: 'Session',
        icon: <LogoutRounded />,
        onSelect: async () => {
          await signOut(
            () => showSnackbar({message: 'You have been logged out.'}),
            () => showSnackbar({message: 'Logout failed. Please try again.'}),
          );
        },
      },
    ];
    register(commands);
    return () => unregister(commands.map(c => c.id));
  }, [register, unregister, router, showSnackbar]);

  return null;
};
