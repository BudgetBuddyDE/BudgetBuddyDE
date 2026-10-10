'use client';

import React from 'react';
import {Cell, Funnel, FunnelChart as RechartsFunnelChart, Tooltip} from 'recharts';
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

  return (
    <ParentSize width={width}>
      {({width: measured}) => (
        <>
          <ChartLegend
            items={data.map(item => ({
              key: item.name,
              label: item.name,
              color: item.fill ?? getSeriesColor(theme, item.name),
              value: (valueFormatter ?? String)(item.value),
            }))}
          />
          <RechartsFunnelChart width={measured} height={height} margin={{top: 8, right: 12, left: 12, bottom: 8}}>
            {!hideTooltip && <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />}
            <Funnel dataKey="value" data={data} isAnimationActive={false}>
              {data.map(entry => (
                <Cell key={entry.name} fill={entry.fill ?? getSeriesColor(theme, entry.name)} />
              ))}
            </Funnel>
          </RechartsFunnelChart>
        </>
      )}
    </ParentSize>
  );
};
