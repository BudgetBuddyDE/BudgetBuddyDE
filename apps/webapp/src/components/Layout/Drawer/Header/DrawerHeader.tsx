'use client';

import {Brand} from '@/components/Brand';
import {useScreenSize} from '@/hooks/useScreenSize';
import {useDrawerContext} from '../DrawerContext';
import {StyledDrawerHeader} from './StyledDrawerHeader';

export const DrawerHeader = () => {
  const screenSize = useScreenSize();
  const {isOpen} = useDrawerContext();

  if (screenSize === 'small') {
    return (
      <StyledDrawerHeader sx={{justifyContent: 'flex-start'}}>
        <Brand asLink boxStyle={{ml: 2}} />
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
    </StyledDrawerHeader>
  );
};
