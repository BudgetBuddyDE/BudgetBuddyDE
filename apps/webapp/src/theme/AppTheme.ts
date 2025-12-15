'use client';

import {createTheme} from '@mui/material/styles';
import {ColorOptions as DarkColorOptions} from './DarkTheme';
import {
  breakpoints,
  components,
  direction,
  mixins,
  shadows,
  shape,
  spacing,
  transitions,
  typography,
  zIndex,
} from './General';

export const AppTheme = createTheme({
  defaultColorScheme: 'dark',
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    dark: DarkColorOptions,
    light: {},
  },
  components,
  spacing,
  breakpoints,
  direction,
  mixins,
  shadows,
  shape,
  transitions,
  typography,
  zIndex,
});
