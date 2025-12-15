import type {Components, Theme} from '@mui/material/styles';
import {axisClasses, chartsGridClasses, legendClasses} from '@mui/x-charts';
import type {ChartsComponents} from '@mui/x-charts/themeAugmentation';
import {colors} from '../DarkTheme/colors';
import {shape} from './shape';

const ChartOptions: ChartsComponents<Theme> = {
  MuiBarChart: {
    defaultProps: {
      skipAnimation: true,
    },
  },
  MuiLineChart: {
    defaultProps: {
      skipAnimation: true,
    },
  },
  // @ts-expect-error
  MuiPieChart: {
    defaultProps: {
      skipAnimation: true,
    },
  },
  MuiChartsAxis: {
    styleOverrides: {
      root: ({theme}) => ({
        [`& .${axisClasses.line}`]: {
          stroke: colors.grey?.[300],
        },
        [`& .${axisClasses.tick}`]: {stroke: colors.grey?.[300]},
        [`& .${axisClasses.tickLabel}`]: {
          fill: colors.grey?.[500],
          fontWeight: 500,
        },
        ...theme.applyStyles('dark', {
          [`& .${axisClasses.line}`]: {
            stroke: colors.grey?.[700],
          },
          [`& .${axisClasses.tick}`]: {stroke: colors.grey?.[700]},
          [`& .${axisClasses.tickLabel}`]: {
            fill: colors.grey?.[300],
            fontWeight: 500,
          },
        }),
      }),
    },
  },
  MuiChartsTooltip: {
    styleOverrides: {
      mark: ({theme}) => ({
        width: theme.spacing(1.5),
        height: theme.spacing(1.5),
        borderRadius: 3,
        boxShadow: 'none',
        border: `1px solid ${theme.palette.divider}`,
      }),
      table: ({theme}) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        background: 'hsl(0, 0%, 100%)',
        ...theme.applyStyles('dark', {
          background: colors.grey?.[900],
        }),
      }),
    },
  },
  MuiChartsLegend: {
    styleOverrides: {
      root: {
        [`& .${legendClasses.mark}`]: {
          ry: 6,
        },
      },
    },
  },
  MuiChartsGrid: {
    styleOverrides: {
      root: ({theme}) => ({
        [`& .${chartsGridClasses.line}`]: {
          stroke: colors.grey?.[200],
          strokeDasharray: '4 2',
          strokeWidth: 0.8,
        },
        ...theme.applyStyles('dark', {
          [`& .${chartsGridClasses.line}`]: {
            stroke: colors.grey?.[700],
            strokeDasharray: '4 2',
            strokeWidth: 0.8,
          },
        }),
      }),
    },
  },
};

export const components: Components<Theme> = {
  ...ChartOptions,
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
            props: {severity: 'info'},
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
