import {useTheme} from '@mui/material';
import {BarChart as MuiBarChart, type BarChartProps as MuiBarChartProps} from '@mui/x-charts';
import React from 'react';

/**
 * Type definition for the props of the BarChart component.
 */
export type TBarChartProps = MuiBarChartProps;

/**
 * BarChart component.
 *
 * @component
 * @param {TBarChartProps} props - The props for the BarChart component.
 * @returns {React.ReactElement} The rendered BarChart component.
 */
export const BarChart: React.FC<TBarChartProps> = props => {
  const theme = useTheme();

  const defaultProps: Partial<MuiBarChartProps> = {
    skipAnimation: false,
    slotProps: {
      legend: {
        hidden: true,
      },
    },
    borderRadius: theme.shape.borderRadius,
  };

  return <MuiBarChart {...defaultProps} {...props} />;
};
