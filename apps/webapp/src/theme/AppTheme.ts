'use client';

import {createTheme} from '@mui/material/styles';
import {ColorOptions as DarkColorOptions} from './DarkTheme';
import {components, mixins, shape, typography} from './General';

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
  mixins,
  shape,
  typography,
});
