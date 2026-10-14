'use client';

import React from 'react';
import {
  Bar,
  BarChart as RechartsBarChart,
  type BarShapeProps,
  ReferenceLine,
  Rectangle,
  Tooltip,
  XAxis,
  YAxis,
  Customized,
  useXAxisScale,
  useYAxisScale,
} from 'recharts';
import {ChartTooltip, ParentSize} from '../primitives';
import {useChartTheme} from '../theme';
import type {ValueFormatter} from '../types';
import {buildWaterfall} from '../utils/waterfall';
import type {WaterfallInput} from '../utils/waterfall';

export type WaterfallDataPoint = WaterfallInput;
export type WaterfallChartProps = {
  data: WaterfallDataPoint[];
  height?: number;
  width?: number;
  valueFormatter?: ValueFormatter;
  xTickFormatter?: (value: unknown) => string;
};

const WaterfallShape = (props: BarShapeProps) => <Rectangle {...props} />;

function Connectors({rows}: {rows: ReturnType<typeof buildWaterfall>}) {
  const x = useXAxisScale();
  const y = useYAxisScale();
  const theme = useChartTheme();
  if (!x || !y) return null;
  const step = rows.length > 1 ? Math.abs(Number(x(rows[1].label)) - Number(x(rows[0].label))) : 0;
  return (
    <g aria-hidden>
      {rows.slice(0, -1).map((row, index) => (
        <line
          key={index}
          x1={Number(x(row.label)) + Math.min(20, step * 0.3)}
          x2={Number(x(rows[index + 1].label)) - Math.min(20, step * 0.3)}
          y1={Number(y(row.balance))}
          y2={Number(y(row.balance))}
          stroke={theme.axisLineStroke}
          strokeDasharray="3 3"
        />
      ))}
    </g>
  );
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({
  data,
  height = 300,
  width,
  valueFormatter,
  xTickFormatter,
}) => {
  const theme = useChartTheme();
  const rows = React.useMemo(
    () =>
      buildWaterfall(data).map(row => ({
        ...row,
        fill: theme.semantic[row.kind === 'total' ? 'balance' : row.kind === 'increase' ? 'income' : 'expense'],
      })),
    [data, theme.semantic],
  );
  return (
    <ParentSize width={width}>
      {({width: measured}) => (
        <RechartsBarChart
          width={measured}
          height={height}
          data={rows}
          maxBarSize={40}
          margin={{top: 16, right: 16, left: 0, bottom: 8}}
          accessibilityLayer
          aria-label="Cash flow bridge"
        >
          <XAxis
            dataKey="label"
            tick={{fill: theme.axisTickFill, fontSize: 13}}
            axisLine={false}
            tickLine={false}
            tickFormatter={xTickFormatter}
          />
          <YAxis
            width={72}
            domain={['auto', 'auto']}
            tick={{fill: theme.axisTickFill, fontSize: 13}}
            axisLine={false}
            tickLine={false}
            tickFormatter={valueFormatter}
          />
          <ReferenceLine y={0} stroke={theme.axisLineStroke} />
          <Tooltip
            cursor={{fill: theme.gridStroke}}
            content={props => {
              const row = props.payload?.[0]?.payload as ReturnType<typeof buildWaterfall>[number] | undefined;
              return (
                <ChartTooltip
                  active={props.active}
                  label={props.label}
                  valueFormatter={valueFormatter}
                  payload={
                    row
                      ? [
                          {name: row.isTotal ? 'Balance' : 'Change', value: row.value},
                          {name: 'Closing balance', value: row.balance},
                        ]
                      : []
                  }
                />
              );
            }}
          />
          <Bar dataKey="range" isAnimationActive={false} radius={2} shape={WaterfallShape} />
          <Customized component={<Connectors rows={rows} />} />
        </RechartsBarChart>
      )}
    </ParentSize>
  );
};
