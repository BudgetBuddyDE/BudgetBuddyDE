'use client';

import React from 'react';
import {CartesianGrid, Scatter, ScatterChart as RechartsScatterChart, Tooltip, XAxis, YAxis, ZAxis} from 'recharts';
import {ChartLegend, ChartTooltip} from '../primitives';
import {ParentSize} from '../primitives/ParentSize';
import {useChartMotion} from '../primitives/useChartMotion';
import {getSeriesColor, useChartTheme} from '../theme';
import type {BaseChartProps, ValueFormatter} from '../types';

export type ScatterPoint = {
  x: number;
  y: number;
  /** Optional bubble size value (requires `bubble`). */
  z?: number;
};

export type ScatterSeriesConfig = {
  key: string;
  label: string;
  color?: string;
  colorId?: string;
  role?: import('../types').SeriesRole;
  valueFormatter?: import('../types').ValueFormatter;
  data: ScatterPoint[];
};

export type ScatterChartProps = BaseChartProps & {
  series: ScatterSeriesConfig[];
  xLabel?: string;
  yLabel?: string;
  xFormatter?: ValueFormatter;
  yFormatter?: ValueFormatter;
  zFormatter?: ValueFormatter;
  /** Render bubbles sized by the `z` value. Default: false */
  bubble?: boolean;
};

/**
 * Scatter/bubble chart. Ideal for transaction distributions, correlations and
 * outlier detection.
 */
export const ScatterChart: React.FC<ScatterChartProps> = ({
  series,
  height = 300,
  width,
  ariaLabel,
  xLabel,
  yLabel,
  xFormatter,
  yFormatter,
  zFormatter,
  showLegend = false,
  showGrid = true,
  hideTooltip = false,
  animate = false,
  bubble = false,
}) => {
  const theme = useChartTheme();
  const [hiddenKeys, setHiddenKeys] = React.useState<string[]>([]);
  const toggleSeries = (key: string) =>
    setHiddenKeys(keys => (keys.includes(key) ? keys.filter(item => item !== key) : [...keys, key]));
  const motion = useChartMotion(animate);

  return (
    <ParentSize width={width}>
      {({width: measured}) => (
        <>
          {showLegend && (
            <ChartLegend
              hiddenKeys={hiddenKeys}
              onToggle={toggleSeries}
              items={series.map(config => ({
                key: config.key,
                label: config.label,
                color: config.color ?? getSeriesColor(theme, config.colorId ?? config.key, config.role),
                dashed: config.role === 'target',
              }))}
            />
          )}
          <RechartsScatterChart
            aria-label={ariaLabel ?? 'Financial chart'}
            accessibilityLayer
            width={measured}
            height={height}
            margin={{top: 16, right: 16, left: 0, bottom: 8}}
          >
            {showGrid && <CartesianGrid stroke={theme.gridStroke} strokeDasharray="4 2" />}
            <XAxis
              label={
                xLabel
                  ? {value: xLabel, position: 'insideBottomRight', offset: -2, fill: theme.axisTickFill, fontSize: 12}
                  : undefined
              }
              type="number"
              dataKey="x"
              name={xLabel}
              tick={{fill: theme.axisTickFill, fontSize: 13}}
              stroke={theme.axisLineStroke}
              tickLine={false}
              axisLine={false}
              tickFormatter={xFormatter ? (value: number) => xFormatter(Number(value)) : undefined}
            />
            <YAxis
              label={
                yLabel ? {value: yLabel, position: 'insideTopLeft', fill: theme.axisTickFill, fontSize: 12} : undefined
              }
              type="number"
              dataKey="y"
              name={yLabel}
              width={64}
              tick={{fill: theme.axisTickFill, fontSize: 13}}
              stroke={theme.axisLineStroke}
              tickLine={false}
              axisLine={false}
              tickFormatter={yFormatter ? (value: number) => yFormatter(Number(value)) : undefined}
            />
            {bubble && <ZAxis type="number" dataKey="z" name="Volume" range={[40, 400]} />}
            {!hideTooltip && (
              <Tooltip
                cursor={{strokeDasharray: '3 3'}}
                content={<ChartTooltip seriesFormatters={{x: xFormatter, y: yFormatter, z: zFormatter}} />}
              />
            )}

            {series.map(config => (
              <Scatter
                hide={hiddenKeys.includes(config.key)}
                key={config.key}
                name={config.label}
                data={config.data}
                fill={config.color ?? getSeriesColor(theme, config.colorId ?? config.key, config.role)}
                isAnimationActive={motion}
                animationDuration={280}
              />
            ))}
          </RechartsScatterChart>
        </>
      )}
    </ParentSize>
  );
};
