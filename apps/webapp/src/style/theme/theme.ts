import {createTheme} from '@mui/material/styles';

import {
  breakpoints,
  components,
  direction,
  mixins,
  shadows,
  shape,
  transitions,
  typography,
  unstable_strictMode,
  zIndex,
} from './Base';
import {colors} from './colors';

export const drawerWidth = 280;

const BlueTheme = createTheme({
  palette: colors,
  breakpoints,
  direction,
  shape,
  unstable_strictMode,
  components,
  typography,
  mixins,
  shadows,
  transitions,
  zIndex,
});

export default BlueTheme;
