import {
  type BreakpointsOptions,
  type Direction,
  type Theme,
  type TransitionsOptions,
  chipClasses,
  svgIconClasses,
} from '@mui/material';
import {type Components} from '@mui/material/styles';
import {type TypographyOptions} from '@mui/material/styles/createTypography';

import {colors} from './colors';
import {chartsCustomizations} from './customizations';

export const breakpoints: BreakpointsOptions = {
  keys: ['xs', 'sm', 'md', 'lg', 'xl'],
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  },
  unit: 'px',
};

export const direction: Direction = 'ltr';

export const shape: Theme['shape'] = {
  borderRadius: 8,
};

export const unstable_strictMode: Theme['unstable_strictMode'] = false;

export const components: Components<Theme> = {
  ...chartsCustomizations,
  MuiChip: {
    defaultProps: {
      size: 'small',
    },
    styleOverrides: {
      root: ({theme}) => ({
        border: '1px solid',
        borderRadius: '999px',
        [`& .${chipClasses.label}`]: {
          fontWeight: 600,
        },
        variants: [
          {
            props: {
              color: 'default',
            },
            style: {
              borderColor: colors.grey![200],
              // backgroundColor: colors.grey![100],
              [`& .${chipClasses.label}`]: {
                color: colors.grey![500],
              },
              [`& .${chipClasses.icon}`]: {
                color: colors.grey![500],
              },
              ...theme.applyStyles('dark', {
                borderColor: colors.grey![700],
                // backgroundColor: colors.grey![800],
                [`& .${chipClasses.label}`]: {
                  color: colors.grey![300],
                },
                [`& .${chipClasses.icon}`]: {
                  color: colors.grey![300],
                },
              }),
            },
          },
          {
            props: {
              color: 'success',
            },
            style: {
              // @ts-expect-error
              borderColor: colors.success[200],
              // @ts-expect-error
              backgroundColor: colors.success![50],
              [`& .${chipClasses.label}`]: {
                // @ts-expect-error
                color: colors.success![500],
              },
              [`& .${chipClasses.icon}`]: {
                // @ts-expect-error
                color: colors.success![500],
              },
              ...theme.applyStyles('dark', {
                // @ts-expect-error
                borderColor: colors.success![800],
                // @ts-expect-error
                backgroundColor: colors.success![900],
                [`& .${chipClasses.label}`]: {
                  // @ts-expect-error
                  color: colors.success![300],
                },
                [`& .${chipClasses.icon}`]: {
                  // @ts-expect-error
                  color: colors.success![300],
                },
              }),
            },
          },
          {
            props: {
              color: 'error',
            },
            style: {
              // @ts-expect-error
              borderColor: colors.error![100],
              // @ts-expect-error
              backgroundColor: colors.error![50],
              [`& .${chipClasses.label}`]: {
                // @ts-expect-error
                color: colors.error![500],
              },
              [`& .${chipClasses.icon}`]: {
                // @ts-expect-error
                color: colors.error![500],
              },
              ...theme.applyStyles('dark', {
                // @ts-expect-error
                borderColor: colors.error![800],
                // @ts-expect-error
                backgroundColor: colors.error![900],
                [`& .${chipClasses.label}`]: {
                  // @ts-expect-error
                  color: colors.error![200],
                },
                [`& .${chipClasses.icon}`]: {
                  // @ts-expect-error
                  color: colors.error![300],
                },
              }),
            },
          },
          {
            props: {size: 'small'},
            style: {
              maxHeight: 20,
              [`& .${chipClasses.label}`]: {
                fontSize: theme.typography.caption.fontSize,
              },
              [`& .${svgIconClasses.root}`]: {
                fontSize: theme.typography.caption.fontSize,
              },
            },
          },
          {
            props: {size: 'medium'},
            style: {
              [`& .${chipClasses.label}`]: {
                fontSize: theme.typography.caption.fontSize,
              },
            },
          },
        ],
      }),
    },
  },
  MuiGrid: {
    styleOverrides: {
      item: {
        height: 'fit-content',
      },
    },
  },
  MuiGrid2: {
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
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        border: '1px solid transparent',
      },
    },
  },
};

export const typography: TypographyOptions = {
  fontFamily:
    '"Source Sans Pro","IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
  h1: {
    fontFamily:
      '"Source Sans Pro","PlusJakartaSans-ExtraBold",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    fontSize: 'clamp(2.625rem, 1.2857rem + 3.5714vw, 4rem)',
    fontWeight: 800,
    lineHeight: 1.1142857142857143,
    scrollMarginTop: 'calc(var(--MuiDocs-header-height) + 32px)',
  },
  h2: {
    fontFamily:
      '"Source Sans Pro","PlusJakartaSans-ExtraBold",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    fontSize: 'clamp(1.5rem, 0.9643rem + 1.4286vw, 2.25rem)',
    fontWeight: 800,
    lineHeight: 1.2222222222222223,
    color: '#E7EBF0',
    scrollMarginTop: 'calc(var(--MuiDocs-header-height) + 32px)',
  },
  h3: {
    fontFamily:
      '"Source Sans Pro","PlusJakartaSans-Bold",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    fontSize: '2.25rem',
    lineHeight: 1.2222222222222223,
    letterSpacing: 0.2,
    fontWeight: 400,
    scrollMarginTop: 'calc(var(--MuiDocs-header-height) + 32px)',
  },
  h4: {
    fontFamily:
      '"Source Sans Pro","PlusJakartaSans-Bold",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    fontSize: '1.75rem',
    lineHeight: 1.5,
    letterSpacing: 0.2,
    fontWeight: 400,
    scrollMarginTop: 'calc(var(--MuiDocs-header-height) + 32px)',
  },
  h5: {
    fontFamily:
      '"Source Sans Pro","PlusJakartaSans-Bold",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    fontSize: '1.5rem',
    lineHeight: 1.5,
    letterSpacing: 0.1,
    fontWeight: 400,
    scrollMarginTop: 'calc(var(--MuiDocs-header-height) + 32px)',
  },
  h6: {
    fontSize: '1.25rem',
    lineHeight: 1.5,
    fontFamily:
      '"Source Sans Pro","IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    fontWeight: 500,
    scrollMarginTop: 'calc(var(--MuiDocs-header-height) + 32px)',
  },
  button: {
    textTransform: 'initial',
    fontWeight: 700,
    letterSpacing: 0,
    fontFamily:
      '"Source Sans Pro","IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    fontSize: '0.875rem',
    lineHeight: 1.75,
    scrollMarginTop: 'calc(var(--MuiDocs-header-height) + 32px)',
  },
  subtitle1: {
    fontSize: '1.125rem',
    lineHeight: 1.3333333333333333,
    letterSpacing: 0,
    fontWeight: 500,
    fontFamily:
      '"Source Sans Pro","IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    scrollMarginTop: 'calc(var(--MuiDocs-header-height) + 32px)',
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.5,
    letterSpacing: 0,
    fontFamily:
      '"Source Sans Pro","IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    fontWeight: 400,
    scrollMarginTop: 'calc(var(--MuiDocs-header-height) + 32px)',
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    letterSpacing: 0,
    fontFamily:
      '"Source Sans Pro","IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    fontWeight: 400,
    scrollMarginTop: 'calc(var(--MuiDocs-header-height) + 32px)',
  },
  caption: {
    display: 'inline-block',
    fontSize: '0.75rem',
    lineHeight: 1.5,
    letterSpacing: 0,
    fontWeight: 700,
    fontFamily:
      '"Source Sans Pro","IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    scrollMarginTop: 'calc(var(--MuiDocs-header-height) + 32px)',
  },
  allVariants: {
    scrollMarginTop: 'calc(var(--MuiDocs-header-height) + 32px)',
  },
  htmlFontSize: 16,
  fontSize: 14,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  subtitle2: {
    fontFamily:
      '"Source Sans Pro","IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: 1.57,
    scrollMarginTop: 'calc(var(--MuiDocs-header-height) + 32px)',
  },
  overline: {
    fontFamily:
      '"Source Sans Pro","IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: 2.66,
    textTransform: 'uppercase',
    scrollMarginTop: 'calc(var(--MuiDocs-header-height) + 32px)',
  },
};

export const mixins: Theme['mixins'] = {
  toolbar: {
    minHeight: 56,
    '@media (min-width:0px)': {
      '@media (orientation: landscape)': {
        minHeight: 48,
      },
    },
    '@media (min-width:600px)': {
      minHeight: 64,
    },
  },
};

export const shadows: Theme['shadows'] = [
  'none',
  '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
  '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
  '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
  '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
  '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
  '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
  '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
  '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
  '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
  '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
  '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
  '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
  '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
  '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
  '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
  '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
  '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
  '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
  '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
  '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
  '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
  '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
  '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
  '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)',
];

export const transitions: TransitionsOptions = {
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195,
  },
};
export const zIndex: Theme['zIndex'] = {
  mobileStepper: 1000,
  fab: 1050,
  speedDial: 1050,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500,
};
