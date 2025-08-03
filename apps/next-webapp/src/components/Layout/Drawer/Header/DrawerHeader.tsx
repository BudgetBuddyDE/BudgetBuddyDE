'use client';

import { Brand } from '@/components/Brand';
import { useDrawerStore } from '../Drawer.store';
import { StyledDrawerHeader } from './StyledDrawerHeader';
import { DrawerHamburger } from '../Hamburger';

export const DrawerHeader = () => {
  const { open } = useDrawerStore();

  return (
    <StyledDrawerHeader
      sx={{
        justifyContent: { xs: 'space-between', md: open ? 'space-between' : 'center' },
      }}
    >
      <Brand
        asLink
        boxStyle={{
          display: { xs: 'flex', md: open ? 'flex' : 'none' },
          ml: 2,
        }}
      />

      <DrawerHamburger />
    </StyledDrawerHeader>
  );
};
