import {LineChart as MuiLineChart, type LineChartProps as MuiLineChartProps} from '@mui/x-charts';
import React from 'react';

/**
 * Type definition for the props of the LineChart component.
 */
export type TLineChartProps = MuiLineChartProps;

/**
 * Renders a line chart component.
 *
 * @component
 * @param {TLineChartProps} props - The props for the LineChart component.
 * @returns {React.ReactElement} The rendered LineChart component.
 */
export const LineChart: React.FC<TLineChartProps> = props => {
  const defaultProps: Partial<MuiLineChartProps> = {
    skipAnimation: false,
    slotProps: {
      legend: {
        hidden: true,
      },
    },
  };

  return <MuiLineChart {...defaultProps} {...props} />;
};

/**
 * Defines a linear gradient for an area in a line chart.
 * @param color - The color of the gradient.
 * @param id - The unique identifier for the gradient.
 */
export function AreaGradient({color, id}: {color: string; id: string}) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.5} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}
