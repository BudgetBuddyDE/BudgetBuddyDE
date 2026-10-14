'use client';

import React from 'react';
import {Funnel, FunnelChart as RechartsFunnelChart, Trapezoid, Tooltip, type FunnelTrapezoidItem} from 'recharts';
import {ChartLegend, ChartTooltip} from '../primitives';
import {ParentSize} from '../primitives/ParentSize';
import {getSeriesColor, useChartTheme} from '../theme';
import type {ValueFormatter} from '../types';

export type FunnelDataPoint = {
  name: string;
  value: number;
  fill?: string;
};

export type FunnelChartProps = {
  data: FunnelDataPoint[];
  height?: number;
  width?: number;
  valueFormatter?: ValueFormatter;
  hideTooltip?: boolean;
};

const FunnelShape = (props: FunnelTrapezoidItem) => <Trapezoid {...props} />;

/**
 * Funnel chart. Ideal for a budget funnel
 * (planned -> committed -> spent -> remaining).
 */
export const FunnelChart: React.FC<FunnelChartProps> = ({
  data,
  height = 300,
  width,
  valueFormatter,
  hideTooltip = false,
}) => {
  const theme = useChartTheme();
  const funnelData = data.map(entry => ({
    ...entry,
    fill: entry.fill ?? getSeriesColor(theme, entry.name),
  }));

  return (
    <ParentSize width={width}>
      {({width: measured}) => (
        <>
          <ChartLegend
            items={funnelData.map(item => ({
              key: item.name,
              label: item.name,
              color: item.fill,
              value: (valueFormatter ?? String)(item.value),
            }))}
          />
          <RechartsFunnelChart width={measured} height={height} margin={{top: 8, right: 12, left: 12, bottom: 8}}>
            {!hideTooltip && <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />}
            <Funnel dataKey="value" data={funnelData} isAnimationActive={false} shape={FunnelShape} />
          </RechartsFunnelChart>
        </>
      )}
    </ParentSize>
  );
};
