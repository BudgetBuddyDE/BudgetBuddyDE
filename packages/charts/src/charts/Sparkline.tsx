'use client';

import React from 'react';
import {Area, AreaChart as RechartsAreaChart, Line, LineChart as RechartsLineChart} from 'recharts';
import {ParentSize} from '../primitives/ParentSize';
import {useChartTheme} from '../theme';

export type SparklinePoint = {
  x: string | number;
  y: number;
};

export type SparklineProps = {
  data: number[] | SparklinePoint[];
  height?: number;
  width?: number;
  color?: string;
  /** Render as a filled area instead of a line. Default: false */
  area?: boolean;
  strokeWidth?: number;
};

function normalize(data: number[] | SparklinePoint[]): SparklinePoint[] {
  if (data.length === 0) return [];
  if (typeof data[0] === 'number') {
    return (data as number[]).map((value, index) => ({x: index, y: value}));
  }
  return data as SparklinePoint[];
}

/**
 * Minimal inline trend chart for KPI cards. No axes, no tooltip.
 */
export const Sparkline: React.FC<SparklineProps> = ({
  data,
  height = 48,
  width,
  color,
  area = false,
  strokeWidth = 2,
}) => {
  const theme = useChartTheme();
  const series = React.useMemo(() => normalize(data), [data]);
  const stroke = color ?? theme.semantic.balance;

  return (
    <ParentSize width={width}>
      {({width: measured}) => {
        const chartWidth = measured;
        if (area) {
          return (
            <RechartsAreaChart
              width={chartWidth}
              height={height}
              data={series}
              margin={{top: 2, right: 0, left: 0, bottom: 2}}
            >
              <Area
                type="monotone"
                dataKey="y"
                stroke={stroke}
                fill={stroke}
                fillOpacity={0.25}
                strokeWidth={strokeWidth}
                isAnimationActive={false}
              />
            </RechartsAreaChart>
          );
        }
        return (
          <RechartsLineChart
            width={chartWidth}
            height={height}
            data={series}
            margin={{top: 2, right: 0, left: 0, bottom: 2}}
          >
            <Line
              type="monotone"
              dataKey="y"
              stroke={stroke}
              strokeWidth={strokeWidth}
              dot={false}
              isAnimationActive={false}
            />
          </RechartsLineChart>
        );
      }}
    </ParentSize>
  );
};
