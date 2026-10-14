'use client';

import React from 'react';
import {
  Brush,
  CartesianGrid,
  Line,
  LabelList,
  LineChart as RechartsLineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {ChartLegend, ChartTooltip} from '../primitives';
import {ParentSize} from '../primitives/ParentSize';
import {useChartMotion} from '../primitives/useChartMotion';
import {getSeriesColor, useChartTheme} from '../theme';
import type {BaseChartProps, CartesianSeriesConfig, ChartDataRow, ReferenceLineConfig} from '../types';

export type {ReferenceLineConfig} from '../types';

export type LineChartProps = BaseChartProps & {
  data: ChartDataRow[];
  xKey: string;
  series: CartesianSeriesConfig[];
  /** Use a smooth (monotone) curve. Default: false */
  curved?: boolean;
  /** Render data point dots. Default: false */
  showDots?: boolean;
  /** Connect across null values. Default: false */
  connectNulls?: boolean;
  /** Horizontal/vertical reference lines (e.g. averages or thresholds). */
  referenceLines?: ReferenceLineConfig[];
  /** Sync the tooltip cursor across charts sharing the same id. */
  syncId?: string;
  /** Render a brush range selector below the chart. Default: false */
  brush?: boolean;
  showEndLabel?: boolean;
  xTickFormatter?: (value: unknown) => string;
};

/**
 * Multi series line chart. Ideal for balances, net worth and trends over time.
 */
export const LineChart: React.FC<LineChartProps> = ({
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
  curved = false,
  showDots = false,
  connectNulls = false,
  referenceLines,
  syncId,
  brush = false,
  showEndLabel = false,
}) => {
  const theme = useChartTheme();
  const [hiddenKeys, setHiddenKeys] = React.useState<string[]>([]);
  const toggleSeries = (key: string) =>
    setHiddenKeys(keys => (keys.includes(key) ? keys.filter(item => item !== key) : [...keys, key]));
  const motion = useChartMotion(animate);
  const axisFormatter = axisValueFormatter ?? valueFormatter;

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
          <RechartsLineChart
            aria-label={ariaLabel ?? 'Financial chart'}
            accessibilityLayer
            width={measured}
            height={height}
            data={data}
            syncId={syncId}
            margin={{top: 16, right: showEndLabel && measured > 500 ? 90 : 16, left: 0, bottom: brush ? 8 : 0}}
          >
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

            {referenceLines?.map((reference, index) => (
              <ReferenceLine
                key={`${reference.label ?? 'reference'}-${index}`}
                {...(reference.x !== undefined ? {x: reference.x} : {y: reference.y})}
                stroke={reference.color ?? theme.semantic.target}
                strokeDasharray="4 2"
                label={
                  reference.label
                    ? {value: reference.label, fill: theme.axisTickFill, fontSize: 11, position: 'insideTopRight'}
                    : undefined
                }
              />
            ))}
            {series.map(config => (
              <Line
                hide={hiddenKeys.includes(config.key)}
                key={config.key}
                type={curved ? 'monotone' : 'linear'}
                dataKey={config.key}
                name={config.label}
                stroke={config.color ?? getSeriesColor(theme, config.colorId ?? config.key, config.role)}
                strokeWidth={2.5}
                strokeDasharray={config.strokeDasharray}
                dot={showDots && data.length <= 16}
                activeDot={{r: 4}}
                connectNulls={connectNulls}
                isAnimationActive={motion}
                animationDuration={280}
              >
                {showEndLabel && measured > 500 && (
                  <LabelList
                    dataKey={config.key}
                    position="right"
                    fill={config.color ?? getSeriesColor(theme, config.colorId ?? config.key, config.role)}
                    content={props => {
                      if (props.index !== data.length - 1 || typeof props.value !== 'number') return null;
                      return (
                        <text
                          x={Number(props.x) + 10}
                          y={Number(props.y)}
                          fill={config.color ?? getSeriesColor(theme, config.colorId ?? config.key, config.role)}
                          fontSize={13}
                          dominantBaseline="middle"
                        >
                          {(axisFormatter ?? String)(props.value)}
                        </text>
                      );
                    }}
                  />
                )}
              </Line>
            ))}
            {brush && <Brush dataKey={xKey} height={22} stroke={theme.axisLineStroke} fill={theme.surface} />}
          </RechartsLineChart>
        </>
      )}
    </ParentSize>
  );
};
