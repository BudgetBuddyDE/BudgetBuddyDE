'use client';

import {ChartsTooltip} from '@mui/x-charts';
import {BarPlot} from '@mui/x-charts/BarChart';
import {ChartsAxisHighlight} from '@mui/x-charts/ChartsAxisHighlight';
import {ChartsContainer, type ChartsContainerProps} from '@mui/x-charts/ChartsContainer';
import {ChartsXAxis} from '@mui/x-charts/ChartsXAxis';
import {ChartsYAxis} from '@mui/x-charts/ChartsYAxis';
import {LinePlot, MarkPlot} from '@mui/x-charts/LineChart';
import type React from 'react';

export type BarLineChartProps = ChartsContainerProps;

export const BarLineChart: React.FC<BarLineChartProps> = ({...props}) => {
  const defaultProps: Partial<BarLineChartProps> = {
    skipAnimation: false,
  };

  return (
    <ChartsContainer {...defaultProps} {...props}>
      <ChartsTooltip trigger="axis" />
      <ChartsAxisHighlight x="band" />
      <BarPlot />
      <LinePlot />
      <MarkPlot />
      <ChartsXAxis />
      <ChartsYAxis />
    </ChartsContainer>
  );
};
