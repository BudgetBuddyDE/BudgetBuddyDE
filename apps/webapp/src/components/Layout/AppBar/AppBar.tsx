'use client';

import LogoutIcon from '@mui/icons-material/LogoutRounded';
import SettingsIcon from '@mui/icons-material/SettingsRounded';
import {
  Box,
  Button,
  Container,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  AppBar as MuiAppBar,
  Stack,
  Toolbar,
  Tooltip,
} from '@mui/material';
import {useRouter} from 'next/navigation';
import React from 'react';
import {signOut} from '@/authClient';
import {Brand} from '@/components/Brand';
import {useSnackbarContext} from '@/components/Snackbar';
import {Avatar} from '@/components/User';
import {DrawerHamburger} from '../Drawer/Hamburger';

export type AppBarProps = {
  showBrand?: boolean;
};

export const AppBar: React.FC<AppBarProps> = ({showBrand = false}) => {
  const router = useRouter();
  const {showSnackbar} = useSnackbarContext();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const MenuLinks = [
    {label: 'Website', href: 'https://budgetbuddy.dev'},
    {label: 'GitHub', href: 'https://github.com/BudgetBuddyDE'},
  ];

  const handleLogOut = async () => {
    await signOut(
      () => {
        showSnackbar({message: 'You have been logged out.'});
      },
      () => {
        showSnackbar({
          message: 'Logout failed. Please try again.',
          action: <Button onClick={handleLogOut}>Retry</Button>,
        });
      },
    );
  };

  const ProfileMenu = [
    {
      icon: <SettingsIcon />,
      label: 'Settings',
      onClick: () => router.push('/settings/profile'),
    },
    {
      icon: <LogoutIcon />,
      label: 'Logout',
      onClick: handleLogOut,
    },
  ];

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <MuiAppBar
      position="sticky"
      elevation={0}
      sx={{
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'divider',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <DrawerHamburger size="medium" />
          {showBrand && <Brand asLink boxStyle={{ml: 1}} />}

          {/* Menu: Desktop */}
          <Stack
            direction={'row'}
            sx={{
              marginLeft: 'auto',
              marginRight: 2,
            }}
          >
            <Box
              sx={{
                display: {xs: 'none', md: 'flex'},
                marginRight: 2,
              }}
            >
              {MenuLinks.map(page => (
                <Button key={page.label} href={page.href} sx={{my: 2, color: 'white', display: 'block'}}>
                  {page.label}
                </Button>
              ))}
            </Box>

            {/* Profile */}
            <Tooltip title="Profile">
              <IconButton onClick={handleOpenUserMenu} sx={{p: 0, height: 'min-content', my: 'auto'}}>
                <Avatar />
              </IconButton>
            </Tooltip>
            <Menu
              elevation={1}
              sx={{mt: '45px'}}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {ProfileMenu.map(item => (
                <MenuItem
                  key={item.label}
                  onClick={() => {
                    item.onClick();
                    handleCloseUserMenu();
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText>{item.label}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </Stack>
        </Toolbar>
      </Container>
    </MuiAppBar>
  );
};
