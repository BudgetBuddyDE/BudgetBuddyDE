'use client';

import React from 'react';
import {PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart as RechartsRadarChart, Tooltip} from 'recharts';
import {ChartLegend, ChartTooltip} from '../primitives';
import {ParentSize} from '../primitives/ParentSize';
import {useChartMotion} from '../primitives/useChartMotion';
import {getSeriesColor, useChartTheme} from '../theme';
import type {BaseChartProps, ChartDataRow} from '../types';

export type RadarSeriesConfig = {
  key: string;
  label: string;
  color?: string;
  colorId?: string;
  role?: import('../types').SeriesRole;
  valueFormatter?: import('../types').ValueFormatter;
};

export type RadarChartProps = BaseChartProps & {
  data: ChartDataRow[];
  /** Key of the metric/axis label inside each data row. */
  metricKey?: string;
  metricLabel?: string;
  series: RadarSeriesConfig[];
  /** Fill the radar area. Default: false */
  fillArea?: boolean;
  /** Render data point markers. Default: false */
  showMarkers?: boolean;
  startAngle?: number;
};

/**
 * Radar chart comparing several series across metrics.
 * Ideal for budget target vs. actual spending across categories.
 */
export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  metricKey = 'metric',
  series,
  height = 300,
  width,
  valueFormatter,
  axisValueFormatter,
  tooltipValueFormatter,
  ariaLabel,
  showLegend = true,
  hideTooltip = false,
  animate = false,
  fillArea = false,
  showMarkers = false,
  startAngle = 90,
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
          <RechartsRadarChart
            aria-label={ariaLabel ?? 'Financial chart'}
            accessibilityLayer
            width={measured}
            height={height}
            data={data}
            cx="50%"
            cy="50%"
            outerRadius="70%"
            startAngle={startAngle}
            margin={{top: 12, right: 24, left: 24, bottom: 12}}
          >
            <PolarGrid stroke={theme.gridStroke} />
            <PolarAngleAxis dataKey={metricKey} tick={{fill: theme.axisTickFill, fontSize: 13}} />
            <PolarRadiusAxis
              tick={{fill: theme.axisTickFill, fontSize: 10}}
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
                <Radar
                  hide={hiddenKeys.includes(config.key)}
                  key={config.key}
                  dataKey={config.key}
                  name={config.label}
                  stroke={color}
                  strokeDasharray={config.role === 'target' ? '5 4' : undefined}
                  fill={color}
                  fillOpacity={fillArea ? 0.14 : 0}
                  dot={showMarkers}
                  isAnimationActive={motion}
                  animationDuration={280}
                />
              );
            })}
          </RechartsRadarChart>
        </>
      )}
    </ParentSize>
  );
};
