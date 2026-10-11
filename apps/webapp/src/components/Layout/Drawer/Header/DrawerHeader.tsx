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
        justifyContent: isOpen(screenSize) ? 'flex-start' : 'center',
      }}
    >
      <Brand
        asLink
        boxStyle={{
          justifyContent: isOpen(screenSize) ? 'flex-start' : 'center',
          width: '100%',
          pl: isOpen(screenSize) ? 1 : 0,
        }}
        typographyStyle={{display: isOpen(screenSize) ? 'block' : 'none'}}
      />
    </StyledDrawerHeader>
  );
};
