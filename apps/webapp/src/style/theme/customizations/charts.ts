import {type Theme} from '@mui/material/styles';
import {axisClasses, chartsGridClasses, legendClasses} from '@mui/x-charts';
import type {ChartsComponents} from '@mui/x-charts/themeAugmentation';

import {colors} from '../colors';

export const chartsCustomizations: ChartsComponents<Theme> = {
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
  // @ts-ignore
  MuiPieChart: {
    defaultProps: {
      skipAnimation: true,
    },
  },
  MuiChartsAxis: {
    styleOverrides: {
      root: ({theme}) => ({
        [`& .${axisClasses.line}`]: {
          stroke: colors.grey![300],
        },
        [`& .${axisClasses.tick}`]: {stroke: colors.grey![300]},
        [`& .${axisClasses.tickLabel}`]: {
          fill: colors.grey![500],
          fontWeight: 500,
        },
        ...theme.applyStyles('dark', {
          [`& .${axisClasses.line}`]: {
            stroke: colors.grey![700],
          },
          [`& .${axisClasses.tick}`]: {stroke: colors.grey![700]},
          [`& .${axisClasses.tickLabel}`]: {
            fill: colors.grey![300],
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
          background: colors.grey![900],
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
          stroke: colors.grey![200],
          strokeDasharray: '4 2',
          strokeWidth: 0.8,
        },
        ...theme.applyStyles('dark', {
          [`& .${chartsGridClasses.line}`]: {
            stroke: colors.grey![700],
            strokeDasharray: '4 2',
            strokeWidth: 0.8,
          },
        }),
      }),
    },
  },
};
