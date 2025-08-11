'use client';

import { Divider, List, Drawer as MuiDrawer } from '@mui/material';
import React from 'react';

import { useDrawerStore } from './Drawer.store';
import { DrawerLinks } from './Links/DrawerLinks';
import { DrawerProfile } from './Profile/DrawerProfile';
import { StyledDrawer } from './StyledDrawer';
import { DrawerItem } from './Item';
import { DrawerHeader } from './Header';

/**
 * We're inverting the showDrawer-value on mobile devices because it should be hidden by default on mobile devices for better UX
 */
export const Drawer = () => {
  const { open: showDrawer, toggle: toggleDrawer } = useDrawerStore();
  const DrawerItems: React.FC<{ open: boolean; closeOnClick?: boolean }> = ({
    open,
    closeOnClick = false,
  }) => {
    return (
      <React.Fragment>
        <Divider />
        <List>
          {DrawerLinks.map((link) => (
            <DrawerItem key={link.path} open={open} {...link} closeOnClick={closeOnClick} />
          ))}
        </List>
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      {/* Mobile */}
      <MuiDrawer
        variant="temporary"
        open={!showDrawer}
        onClose={(_ev, reason) => reason === 'backdropClick' && toggleDrawer()}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        slotProps={{
          paper: {
            elevation: 0,
          },
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: '80%' },
        }}
      >
        <DrawerHeader />
        <DrawerItems open={!showDrawer} closeOnClick />
        <DrawerProfile />
      </MuiDrawer>

      {/* Desktop */}
      <StyledDrawer
        variant="permanent"
        open={showDrawer}
        sx={{ display: { xs: 'none', md: 'unset' } }}
        ModalProps={{
          keepMounted: true, // Better open performance
        }}
      >
        <DrawerHeader />
        <DrawerItems open={showDrawer} />
        <DrawerProfile />
      </StyledDrawer>
    </React.Fragment>
  );
};
