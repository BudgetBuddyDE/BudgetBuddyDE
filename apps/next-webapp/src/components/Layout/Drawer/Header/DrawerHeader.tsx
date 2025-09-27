'use client';

import { Brand } from '@/components/Brand';
import { StyledDrawerHeader } from './StyledDrawerHeader';
import { DrawerHamburger } from '../Hamburger';
import { useDrawerContext } from '../DrawerContext';
import { useScreenSize } from '@/hooks/useScreenSize';
import React from 'react';

export const DrawerHeader = () => {
  const screenSize = useScreenSize();
  const { isOpen } = useDrawerContext();

  if (screenSize === 'small') {
    return (
      <StyledDrawerHeader sx={{ justifyContent: 'space-between' }}>
        <Brand asLink boxStyle={{ ml: 2 }} />
        <DrawerHamburger />
      </StyledDrawerHeader>
    );
  }

  return (
    <StyledDrawerHeader
      sx={{
        justifyContent: {
          xs: 'space-between',
          md: isOpen(screenSize) ? 'space-between' : 'center',
        },
      }}
    >
      <Brand
        asLink
        boxStyle={{
          display: isOpen(screenSize) ? 'block' : 'none',
          ml: 2,
        }}
      />
      <DrawerHamburger />
    </StyledDrawerHeader>
  );
};
