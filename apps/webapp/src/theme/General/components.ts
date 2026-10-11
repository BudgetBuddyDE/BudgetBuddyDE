import type {Components, Theme} from '@mui/material/styles';
import {shape} from './shape';

export const components: Components<Theme> = {
  MuiTableCell: {
    styleOverrides: {
      stickyHeader: {
        backgroundColor: 'transparent',
        backgroundImage: 'none',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        cornerShape: 'squircle',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        cornerShape: 'squircle',
      },
    },
  },
  MuiGrid: {
    styleOverrides: {
      root: {
        height: 'fit-content',
      },
    },
  },
  MuiAutocomplete: {
    styleOverrides: {
      listbox: ({theme}) => ({
        paddingLeft: theme.spacing(0.75),
        paddingRight: theme.spacing(0.75),
      }),
      option: ({theme}) => ({
        borderRadius: Number(theme.shape.borderRadius) * 0.6,
      }),
    },
  },
  MuiMenu: {
    styleOverrides: {
      root: ({theme}) => ({
        '& .MuiList-root': {
          paddingTop: 0,
          paddingBottom: 0,
          margin: theme.spacing(0.75),
        },
      }),
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: ({theme}) => ({
        borderRadius: Number(theme.shape.borderRadius) * 0.6,
      }),
    },
  },
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: ({theme}) => ({
        '& .MuiToggleButtonGroup-grouped': {
          margin: theme.spacing(0.5),
          border: 0,
          '&.Mui-disabled': {
            border: 0,
          },
          '&:not(:first-of-type)': {
            borderRadius: Number(theme.shape.borderRadius) * 0.6,
          },
          '&:first-of-type': {
            borderRadius: Number(theme.shape.borderRadius) * 0.6,
          },
        },
      }),
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
