'use client';

import React from 'react';
import {Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, ReferenceLine, Tooltip, XAxis, YAxis} from 'recharts';
import {ChartLegend, ChartTooltip} from '../primitives';
import {ParentSize} from '../primitives/ParentSize';
import {useChartMotion} from '../primitives/useChartMotion';
import {getSeriesColor, useChartTheme} from '../theme';
import type {BaseChartProps, CartesianSeriesConfig, ChartDataRow} from '../types';

export type BarChartProps = BaseChartProps & {
  data: ChartDataRow[];
  xKey: string;
  series: CartesianSeriesConfig[];
  /** Stack bars via a shared stack id. Default: false */
  stacked?: boolean;
  /** Render bars horizontally. Default: false */
  horizontal?: boolean;
  /** Corner radius of bars. Default: 4 */
  radius?: number;
  /** Highlight the zero baseline. Default: false */
  showZeroLine?: boolean;
  xTickFormatter?: (value: unknown) => string;
};

/**
 * Bar chart supporting grouped, stacked, horizontal and negative values.
 * Ideal for income vs. expenses and category comparisons.
 */
export const BarChart: React.FC<BarChartProps> = ({
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
  horizontal = false,
  radius = 4,
  showZeroLine = false,
}) => {
  const theme = useChartTheme();
  const [hiddenKeys, setHiddenKeys] = React.useState<string[]>([]);
  const toggleSeries = (key: string) =>
    setHiddenKeys(keys => (keys.includes(key) ? keys.filter(item => item !== key) : [...keys, key]));
  const motion = useChartMotion(animate);
  const axisFormatter = axisValueFormatter ?? valueFormatter;

  const categoryAxis = (
    <XAxis
      type={horizontal ? 'number' : 'category'}
      dataKey={horizontal ? undefined : xKey}
      tick={{fill: theme.axisTickFill, fontSize: 13}}
      stroke={theme.axisLineStroke}
      tickLine={false}
      axisLine={false}
      tickFormatter={
        axisFormatter && horizontal ? (value: number) => axisFormatter(Number(value)) : (xTickFormatter as never)
      }
    />
  );
  const valueAxis = (
    <YAxis
      type={horizontal ? 'category' : 'number'}
      dataKey={horizontal ? xKey : undefined}
      width={horizontal ? 100 : 64}
      tick={{fill: theme.axisTickFill, fontSize: 13}}
      stroke={theme.axisLineStroke}
      tickLine={false}
      axisLine={false}
      tickFormatter={!horizontal && axisFormatter ? (value: number) => axisFormatter(Number(value)) : undefined}
    />
  );

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
          <RechartsBarChart
            aria-label={ariaLabel ?? 'Financial chart'}
            accessibilityLayer
            width={measured}
            height={height}
            data={data}
            maxBarSize={36}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{top: 16, right: 16, left: 0, bottom: 8}}
          >
            {showGrid && (
              <CartesianGrid
                stroke={theme.gridStroke}
                strokeDasharray="4 2"
                vertical={horizontal}
                horizontal={!horizontal}
              />
            )}
            {categoryAxis}
            {valueAxis}
            {!hideTooltip && (
              <Tooltip
                content={
                  <ChartTooltip
                    valueFormatter={tooltipValueFormatter ?? valueFormatter}
                    seriesFormatters={Object.fromEntries(series.map(config => [config.key, config.valueFormatter]))}
                  />
                }
                cursor={{fill: theme.gridStroke, fillOpacity: 0.12}}
              />
            )}

            {showZeroLine && <ReferenceLine {...(horizontal ? {x: 0} : {y: 0})} stroke={theme.axisLineStroke} />}
            {series.map(config => {
              const color = config.color ?? getSeriesColor(theme, config.colorId ?? config.key, config.role);
              return (
                <Bar
                  hide={hiddenKeys.includes(config.key)}
                  key={config.key}
                  dataKey={config.key}
                  name={config.label}
                  stackId={stacked ? (config.stackId ?? 'stack') : config.stackId}
                  fill={color}
                  radius={stacked || config.stackId ? 0 : radius}
                  isAnimationActive={motion}
                  animationDuration={280}
                >
                  {config.color ? data.map((_, cellIndex) => <Cell key={cellIndex} fill={color} />) : null}
                </Bar>
              );
            })}
          </RechartsBarChart>
        </>
      )}
    </ParentSize>
  );
};
