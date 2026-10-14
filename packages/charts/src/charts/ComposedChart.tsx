'use client';

import React from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart as RechartsComposedChart,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {ChartLegend, ChartTooltip} from '../primitives';
import {ParentSize} from '../primitives/ParentSize';
import {useChartMotion} from '../primitives/useChartMotion';
import {getSeriesColor, useChartTheme} from '../theme';
import type {BaseChartProps, ChartDataRow, ReferenceLineConfig, SeriesRole, ValueFormatter} from '../types';

export type ComposedSeriesConfig = {
  key: string;
  label: string;
  color?: string;
  colorId?: string;
  role?: SeriesRole;
  valueFormatter?: ValueFormatter;
  type: 'bar' | 'line' | 'area';
  stackId?: string;
  /** Render on a secondary right axis. */
  yAxisId?: 'left' | 'right';
  connectNulls?: boolean;
  showDots?: boolean;
};

export type ComposedChartProps = BaseChartProps & {
  data: ChartDataRow[];
  xKey: string;
  series: ComposedSeriesConfig[];
  xTickFormatter?: (value: unknown) => string;
  showZeroLine?: boolean;
  leftAxisLabel?: string;
  rightAxisLabel?: string;
  rightAxisFormatter?: import('../types').ValueFormatter;
  /** Horizontal/vertical reference values such as averages or targets. */
  referenceLines?: ReferenceLineConfig[];
};

/**
 * Combined chart mixing bars, lines and areas - including a secondary Y axis.
 * Ideal for income/expense bars plus a cumulative balance line.
 */
export const ComposedChart: React.FC<ComposedChartProps> = ({
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
  showLegend = true,
  showGrid = true,
  hideTooltip = false,
  animate = false,
  showZeroLine = false,
  leftAxisLabel,
  rightAxisLabel,
  rightAxisFormatter,
  referenceLines,
}) => {
  const theme = useChartTheme();
  const [hiddenKeys, setHiddenKeys] = React.useState<string[]>([]);
  const toggleSeries = (key: string) =>
    setHiddenKeys(keys => (keys.includes(key) ? keys.filter(item => item !== key) : [...keys, key]));
  const motion = useChartMotion(animate);
  const axisFormatter = axisValueFormatter ?? valueFormatter;
  const hasRightAxis = series.some(config => config.yAxisId === 'right');

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
          <RechartsComposedChart
            aria-label={ariaLabel ?? 'Financial chart'}
            accessibilityLayer
            width={measured}
            height={height}
            data={data}
            maxBarSize={36}
            margin={{top: 32, right: 16, left: 0, bottom: 8}}
          >
            {showGrid && (
              <CartesianGrid yAxisId="left" stroke={theme.axisTickFill} strokeOpacity={0.18} vertical={false} />
            )}
            <XAxis
              dataKey={xKey}
              tick={{fill: theme.axisTickFill, fontSize: 13}}
              stroke={theme.axisLineStroke}
              tickLine={false}
              axisLine={false}
              tickFormatter={xTickFormatter as (value: unknown, index: number) => string}
            />
            <YAxis
              label={
                leftAxisLabel
                  ? {value: leftAxisLabel, position: 'insideTopLeft', fill: theme.axisTickFill, fontSize: 12}
                  : undefined
              }
              yAxisId="left"
              width={64}
              tick={{fill: theme.axisTickFill, fontSize: 13}}
              stroke={theme.axisLineStroke}
              tickLine={false}
              axisLine={false}
              tickFormatter={axisFormatter ? (value: number) => axisFormatter(Number(value)) : undefined}
            />
            {hasRightAxis && (
              <YAxis
                label={
                  rightAxisLabel
                    ? {value: rightAxisLabel, position: 'insideTopRight', fill: theme.semantic.balance, fontSize: 12}
                    : undefined
                }
                yAxisId="right"
                orientation="right"
                width={64}
                tick={{fill: theme.axisTickFill, fontSize: 13}}
                stroke={theme.axisLineStroke}
                tickLine={false}
                axisLine={false}
                tickFormatter={rightAxisFormatter ?? axisFormatter}
              />
            )}
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

            {showZeroLine && <ReferenceLine yAxisId="left" y={0} stroke={theme.axisLineStroke} />}
            {referenceLines?.map((reference, index) => (
              <ReferenceLine
                key={`${reference.label ?? 'reference'}-${index}`}
                {...(reference.x !== undefined ? {x: reference.x} : {y: reference.y})}
                yAxisId={reference.yAxisId ?? 'left'}
                stroke={reference.color ?? (reference.role ? theme.semantic[reference.role] : theme.semantic.target)}
                strokeDasharray="5 4"
                label={
                  reference.label
                    ? {
                        value: reference.label,
                        fill:
                          reference.color ?? (reference.role ? theme.semantic[reference.role] : theme.semantic.target),
                        fontSize: 12,
                        position: 'insideTopRight',
                      }
                    : undefined
                }
              />
            ))}
            {series.map(config => {
              const color = config.color ?? getSeriesColor(theme, config.colorId ?? config.key, config.role);
              const yAxisId = config.yAxisId ?? 'left';
              if (config.type === 'bar') {
                return (
                  <Bar
                    hide={hiddenKeys.includes(config.key)}
                    key={config.key}
                    yAxisId={yAxisId}
                    dataKey={config.key}
                    name={config.label}
                    stackId={config.stackId}
                    fill={color}
                    radius={config.stackId ? 0 : 3}
                    isAnimationActive={motion}
                    animationDuration={280}
                  />
                );
              }
              if (config.type === 'area') {
                return (
                  <Area
                    hide={hiddenKeys.includes(config.key)}
                    key={config.key}
                    yAxisId={yAxisId}
                    dataKey={config.key}
                    name={config.label}
                    stackId={config.stackId}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.18}
                    strokeWidth={2.5}
                    isAnimationActive={motion}
                    animationDuration={280}
                  />
                );
              }
              return (
                <Line
                  hide={hiddenKeys.includes(config.key)}
                  key={config.key}
                  yAxisId={yAxisId}
                  type="linear"
                  dataKey={config.key}
                  name={config.label}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={config.showDots}
                  connectNulls={config.connectNulls}
                  isAnimationActive={motion}
                  animationDuration={280}
                />
              );
            })}
          </RechartsComposedChart>
        </>
      )}
    </ParentSize>
  );
};
