'use client';

import {Box, Typography} from '@mui/material';
import React from 'react';
import {Pie, PieChart as RechartsPieChart, type PieSectorShapeProps, Sector, Tooltip} from 'recharts';
import {ChartLegend, ChartTooltip} from '../primitives';
import {ParentSize} from '../primitives/ParentSize';
import {useChartMotion} from '../primitives/useChartMotion';
import {getSeriesColor, useChartTheme} from '../theme';
import type {ValueFormatter} from '../types';

export type DonutDataPoint = {
  label: string;
  id?: string;
  value: number;
  color?: string;
};

export type DonutChartProps = {
  data: DonutDataPoint[];
  /** Fixed width in px. When omitted the chart fills its container (square). */
  width?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  paddingAngle?: number;
  cornerRadius?: number;
  valueFormatter?: ValueFormatter;
  primaryText?: string;
  secondaryText?: string;
  showLegend?: boolean;
  hideTooltip?: boolean;
  animate?: boolean;
};

const DonutSector = (props: PieSectorShapeProps) => <Sector {...props} />;

/**
 * Donut chart with an optional two line center label.
 * Ideal for spending/income distribution and total amounts.
 */
export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  width,
  innerRadius = '60%',
  outerRadius = '90%',
  paddingAngle = 1,
  cornerRadius = 4,
  valueFormatter,
  primaryText,
  secondaryText,
  showLegend = false,
  hideTooltip = false,
  animate = false,
}) => {
  const theme = useChartTheme();
  const motion = useChartMotion(animate);
  const pieData = data
    .map(entry => ({
      ...entry,
      fill: entry.color ?? getSeriesColor(theme, entry.id ?? entry.label),
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <ParentSize width={width}>
      {({width: measured}) => {
        const size = Math.min(measured, 340);
        const total = data.reduce((sum, item) => sum + item.value, 0);
        return (
          <>
            {showLegend && (
              <ChartLegend
                items={pieData.map(item => ({
                  key: item.id ?? item.label,
                  label: item.label,
                  color: item.fill,
                  value: `${(valueFormatter ?? String)(item.value)} (${total ? Math.round((item.value / total) * 100) : 0}%)`,
                }))}
              />
            )}
            <Box sx={{position: 'relative', width: size, height: size, mx: 'auto'}}>
              <RechartsPieChart width={size} height={size} accessibilityLayer aria-label="Distribution of amounts">
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  paddingAngle={paddingAngle}
                  cornerRadius={cornerRadius}
                  stroke="none"
                  isAnimationActive={motion}
                  animationDuration={280}
                  shape={DonutSector}
                />
                {!hideTooltip && (
                  <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} wrapperStyle={{zIndex: 1}} />
                )}
              </RechartsPieChart>
              {(primaryText || secondaryText) && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    px: 4,
                    textAlign: 'center',
                  }}
                >
                  {primaryText && (
                    <Typography variant="h5" sx={{fontWeight: 700, lineHeight: 1.1}}>
                      {primaryText}
                    </Typography>
                  )}
                  {secondaryText && (
                    <Typography variant="body2" color="text.secondary">
                      {secondaryText}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </>
        );
      }}
    </ParentSize>
  );
};
