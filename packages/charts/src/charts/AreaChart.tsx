'use client';

import React from 'react';
import {Area, AreaChart as RechartsAreaChart, CartesianGrid, Tooltip, XAxis, YAxis} from 'recharts';
import {ChartLegend, ChartTooltip} from '../primitives';
import {ParentSize} from '../primitives/ParentSize';
import {useChartMotion} from '../primitives/useChartMotion';
import {getSeriesColor, useChartTheme} from '../theme';
import type {BaseChartProps, CartesianSeriesConfig, ChartDataRow} from '../types';

export type AreaChartProps = BaseChartProps & {
  data: ChartDataRow[];
  xKey: string;
  series: CartesianSeriesConfig[];
  /** Stack areas on top of each other via a shared stack id. Default: false */
  stacked?: boolean;
  /** Fill opacity of each area. Default: 0.35 */
  fillOpacity?: number;
  curved?: boolean;
  /** Sync the tooltip cursor across charts sharing the same id. */
  syncId?: string;
  /** Subtle fade for a single unstacked series. */
  gradient?: boolean;
  xTickFormatter?: (value: unknown) => string;
};

/**
 * Area chart, optionally stacked. Ideal for cumulative spending and
 * category breakdowns over time.
 */
export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  xKey,
  series,
  height = 300,
  width,
  valueFormatter,
  axisValueFormatter,
  tooltipValueFormatter,
  ariaLabel,
  xTickFormatter,
  showLegend = false,
  showGrid = true,
  hideTooltip = false,
  animate = false,
  stacked = false,
  fillOpacity = 0.18,
  curved = false,
  syncId,
  gradient = false,
}) => {
  const theme = useChartTheme();
  const [hiddenKeys, setHiddenKeys] = React.useState<string[]>([]);
  const toggleSeries = (key: string) =>
    setHiddenKeys(keys => (keys.includes(key) ? keys.filter(item => item !== key) : [...keys, key]));
  const motion = useChartMotion(animate);
  const axisFormatter = axisValueFormatter ?? valueFormatter;
  const gradientId = React.useId().replace(/:/g, '');

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
          <RechartsAreaChart
            aria-label={ariaLabel ?? 'Financial chart'}
            accessibilityLayer
            width={measured}
            height={height}
            data={data}
            syncId={syncId}
            margin={{top: 16, right: 16, left: 0, bottom: 8}}
          >
            {gradient && !stacked && series.length === 1 && (
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={series[0].color ?? getSeriesColor(theme, series[0].key, series[0].role)}
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="100%"
                    stopColor={series[0].color ?? getSeriesColor(theme, series[0].key, series[0].role)}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
            )}
            {showGrid && <CartesianGrid stroke={theme.gridStroke} strokeOpacity={0.8} vertical={false} />}
            <XAxis
              dataKey={xKey}
              tick={{fill: theme.axisTickFill, fontSize: 13}}
              stroke={theme.axisLineStroke}
              tickLine={false}
              axisLine={false}
              tickFormatter={xTickFormatter as (value: unknown, index: number) => string}
            />
            <YAxis
              width={64}
              tick={{fill: theme.axisTickFill, fontSize: 13}}
              stroke={theme.axisLineStroke}
              tickLine={false}
              axisLine={false}
              tickFormatter={axisFormatter ? (value: number) => axisFormatter(Number(value)) : undefined}
            />
            {!hideTooltip && (
              <Tooltip
                content={
                  <ChartTooltip
                    valueFormatter={tooltipValueFormatter ?? valueFormatter}
                    seriesFormatters={Object.fromEntries(series.map(config => [config.key, config.valueFormatter]))}
                  />
                }
              />
            )}

            {series.map(config => {
              const color = config.color ?? getSeriesColor(theme, config.colorId ?? config.key, config.role);
              return (
                <Area
                  hide={hiddenKeys.includes(config.key)}
                  key={config.key}
                  type={curved ? 'monotone' : 'linear'}
                  dataKey={config.key}
                  name={config.label}
                  stackId={stacked ? (config.stackId ?? 'stack') : config.stackId}
                  stroke={color}
                  fill={gradient && !stacked && series.length === 1 ? `url(#${gradientId})` : color}
                  fillOpacity={gradient && !stacked && series.length === 1 ? 1 : fillOpacity}
                  strokeWidth={2.5}
                  isAnimationActive={motion}
                  animationDuration={280}
                />
              );
            })}
          </RechartsAreaChart>
        </>
      )}
    </ParentSize>
  );
};
