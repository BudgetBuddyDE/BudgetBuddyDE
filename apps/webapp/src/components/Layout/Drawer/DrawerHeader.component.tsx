import {Brand} from '../../Brand/Brand.component';
import {useDrawerStore} from './Drawer.store';
import {DrawerHamburger} from './DrawerHamburger.component';
import {StyledDrawerHeader} from './StyledDrawerHeader.component';

export const DrawerHeader = () => {
  const {open} = useDrawerStore();

  return (
    <StyledDrawerHeader
      sx={{
        justifyContent: {xs: 'space-between', md: open ? 'space-between' : 'center'},
      }}>
      <Brand
        asLink
        boxStyle={{
          display: {xs: 'flex', md: open ? 'flex' : 'none'},
          ml: 2,
        }}
      />

      <DrawerHamburger />
    </StyledDrawerHeader>
  );
};
