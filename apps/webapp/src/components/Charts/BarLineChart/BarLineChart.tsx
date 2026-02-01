'use client';

import {ChartsTooltip} from '@mui/x-charts';
import {BarPlot} from '@mui/x-charts/BarChart';
import {ChartContainer, type ChartContainerProps} from '@mui/x-charts/ChartContainer';
import {ChartsAxisHighlight} from '@mui/x-charts/ChartsAxisHighlight';
import {ChartsXAxis} from '@mui/x-charts/ChartsXAxis';
import {ChartsYAxis} from '@mui/x-charts/ChartsYAxis';
import {LinePlot, MarkPlot} from '@mui/x-charts/LineChart';
import type React from 'react';

export type BarLineChartProps = ChartContainerProps;

export const BarLineChart: React.FC<BarLineChartProps> = ({...props}) => {
  const defaultProps: Partial<BarLineChartProps> = {
    skipAnimation: false,
  };

  return (
    <ChartContainer {...defaultProps} {...props}>
      <ChartsTooltip trigger="axis" />
      <ChartsAxisHighlight x="band" />
      <BarPlot />
      <LinePlot />
      <MarkPlot />
      <ChartsXAxis />
      <ChartsYAxis />
    </ChartContainer>
  );
};
