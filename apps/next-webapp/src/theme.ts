'use client';

import { createTheme } from '@mui/material/styles';
import { Roboto } from 'next/font/google';
import { chartsCustomizations } from './style/theme/customizations';
import { type Components, type Theme, chipClasses, svgIconClasses } from '@mui/material';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const shape: Theme['shape'] = {
  borderRadius: 8,
};

const components: Components<Theme> = {
  ...chartsCustomizations,
  MuiGrid: {
    styleOverrides: {
      root: {
        height: 'fit-content',
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      root: {
        '& .MuiList-root': {
          paddingTop: 0,
          paddingBottom: 0,
          margin: '.3rem',
        },
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius,
      },
    },
  },
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: {
        '& .MuiToggleButtonGroup-grouped': {
          margin: '.25rem',
          border: 0,
          '&.Mui-disabled': {
            border: 0,
          },
          '&:not(:first-of-type)': {
            borderRadius: shape.borderRadius,
          },
          '&:first-of-type': {
            borderRadius: shape.borderRadius,
          },
        },
      },
    },
  },
  MuiTable: {
    styleOverrides: {
      stickyHeader: {
        '& th': {
          // FIXME: Replace with correct color
          // backgroundColor: '#121212',
        },
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        variants: [
          {
            props: { severity: 'info' },
            style: {
              // backgroundColor: '#60a5fa',
            },
          },
        ],
      },
    },
  },
  MuiChip: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius,
      },
    },
  },
};

const theme = createTheme({
  defaultColorScheme: 'dark',
  colorSchemes: { light: true, dark: true },
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
  components,
  shape,
});

export default theme;
