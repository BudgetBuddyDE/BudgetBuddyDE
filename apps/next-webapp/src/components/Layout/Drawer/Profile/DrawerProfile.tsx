'use client';

import { LogoutRounded as LogoutIcon } from '@mui/icons-material';
import { Box, Button, type ButtonProps, Chip, Divider, Typography, useTheme } from '@mui/material';
import React from 'react';
import { useRouter } from 'next/navigation';

import { useScreenSize } from '@/hooks/useScreenSize';

import { Avatar } from '@/components/User';
import { authClient, signOut } from '@/authClient';
import { useSnackbarContext } from '@/components/Snackbar';
import { useDrawerContext } from '../DrawerContext';

export type DrawerProfileProps = {};

export const DrawerProfile: React.FC<DrawerProfileProps> = () => {
  const theme = useTheme();
  const router = useRouter();
  const screenSize = useScreenSize();
  const { showSnackbar } = useSnackbarContext();
  const { data: sessionData } = authClient.useSession();
  const { isOpen, toggleVisibility } = useDrawerContext();

  const handleLogout = async () => {
    await signOut(
      () => {
        showSnackbar({ message: 'You have been logged out.' });
      },
      () => {
        showSnackbar({
          message: 'Logout failed. Please try again.',
          action: <Button onClick={handleLogout}>Retry</Button>,
        });
      }
    );
  };

  const handleProfileClick = () => {
    if (isOpen('small')) {
      toggleVisibility();
    }
    router.push('/settings/profile');
  };

  if (!sessionData) return null;
  return (
    <Box sx={{ mt: 'auto', backgroundColor: theme.palette.action.focus }}>
      <Divider />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
        }}
      >
        <Box
          sx={{
            transition: '100ms',
            display:
              screenSize == 'small'
                ? 'flex'
                : // On wider devices, the profile needs to be hidden when the drawer is closed
                isOpen('medium')
                ? 'flex'
                : 'none',
            flexGrow: 1,
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: theme.shape.borderRadius + 'px',
            px: 0.5,
            ':hover': {
              backgroundColor: 'action.hover',
              cursor: 'Pointer',
            },
          }}
          onClick={handleProfileClick}
        >
          <Avatar />
          <Box sx={{ ml: '.5rem' }}>
            <Typography fontWeight="bold">{sessionData.user.name}</Typography>
            <Chip label={'Basic'} variant="outlined" size="small" />
          </Box>
        </Box>
        <LogoutButton
          onClick={handleLogout}
          sx={{
            ml: isOpen('medium') ? 'auto' : '-.5rem',
            ':hover': {
              backgroundColor: 'action.hover',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export const LogoutButton: React.FC<ButtonProps> = (props) => {
  const theme = useTheme();
  return (
    <Button
      {...props}
      sx={{
        minWidth: 48,
        width: 48,
        height: 48,
        minHeight: 48,
        p: 0,
        ...props.sx,
      }}
    >
      <LogoutIcon sx={{ color: theme.palette.background.default }} />
    </Button>
  );
};
