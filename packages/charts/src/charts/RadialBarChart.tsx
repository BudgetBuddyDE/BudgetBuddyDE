'use client';

import {Typography} from '@mui/material';
import React from 'react';
import {Cell, PolarAngleAxis, RadialBar, RadialBarChart as RechartsRadialBarChart, Tooltip} from 'recharts';
import {ChartLegend, ChartTooltip} from '../primitives';
import {ParentSize} from '../primitives/ParentSize';
import {useChartMotion} from '../primitives/useChartMotion';
import {getSeriesColor, useChartTheme} from '../theme';
import type {ValueFormatter} from '../types';

export type RadialBarDataPoint = {
  label: string;
  value: number;
  fill?: string;
};

export type RadialBarChartProps = {
  data: RadialBarDataPoint[];
  height?: number;
  width?: number;
  /** Maximum of the scale. Defaults to the largest value. */
  max?: number;
  /** Half circle gauge (180deg) instead of a full circle. Default: false */
  gauge?: boolean;
  innerRadius?: number | string;
  outerRadius?: number | string;
  valueFormatter?: ValueFormatter;
  showLegend?: boolean;
  hideTooltip?: boolean;
  animate?: boolean;
};

/**
 * Radial bar chart. With `gauge` it renders a half circle progress gauge,
 * ideal for budget usage and savings goal progress.
 */
export const RadialBarChart: React.FC<RadialBarChartProps> = ({
  data,
  height = 300,
  width,
  max,
  gauge = false,
  innerRadius = '30%',
  outerRadius = '100%',
  valueFormatter,
  showLegend = true,
  hideTooltip = false,
  animate = false,
}) => {
  const theme = useChartTheme();
  const motion = useChartMotion(animate);
  const domainMax = Math.max(max ?? 1, ...data.map(point => point.value));

  return (
    <ParentSize width={width}>
      {({width: measured}) => (
        <>
          {showLegend && (
            <ChartLegend
              items={data.map(item => ({
                key: item.label,
                label: item.label,
                color: item.fill ?? getSeriesColor(theme, item.label),
                value: (valueFormatter ?? String)(item.value),
              }))}
            />
          )}
          <RechartsRadialBarChart
            width={measured}
            height={height}
            data={data.map(item => ({...item, name: item.label}))}
            cx="50%"
            cy={gauge ? '75%' : '50%'}
            innerRadius={innerRadius}
            outerRadius={gauge ? Math.min(measured / 2 - 16, height * 0.65) : outerRadius}
            startAngle={gauge ? 180 : 90}
            endAngle={gauge ? 0 : -270}
          >
            <PolarAngleAxis type="number" domain={[0, domainMax]} tick={false} />
            {!hideTooltip && <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />}
            <RadialBar
              dataKey="value"
              background={{fill: theme.gridStroke}}
              cornerRadius={8}
              isAnimationActive={motion}
              animationDuration={280}
            >
              {data.map(entry => (
                <Cell key={entry.label} fill={entry.fill ?? getSeriesColor(theme, entry.label)} />
              ))}
            </RadialBar>
          </RechartsRadialBarChart>
          {max !== undefined && (
            <Typography variant="body2" color="text.secondary">
              Target: {(valueFormatter ?? String)(max)}. Values above the target remain visible.
            </Typography>
          )}
        </>
      )}
    </ParentSize>
  );
};
