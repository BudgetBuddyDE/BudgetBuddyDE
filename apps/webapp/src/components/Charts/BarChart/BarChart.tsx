'use client';

import {useTheme} from '@mui/material';
import {BarChart as MuiBarChart, type BarChartProps as MuiBarChartProps} from '@mui/x-charts';
import type React from 'react';

/**
 * Type definition for the props of the BarChart component.
 */
export type BarChartProps = MuiBarChartProps;

/**
 * BarChart component.
 *
 * @component
 * @param {BarChartProps} props - The props for the BarChart component.
 * @returns {React.ReactElement} The rendered BarChart component.
 */
export const BarChart: React.FC<BarChartProps> = props => {
  const _theme = useTheme();

  const defaultProps: Partial<MuiBarChartProps> = {
    skipAnimation: false,
    slotProps: {
      legend: {
        // FIXME:
        // hidden: true,
      },
    },
    // FIXME:
    // borderRadius: theme.shape.borderRadius,
  };

  return <MuiBarChart {...defaultProps} {...props} />;
};
