'use client';

import React from 'react';
import {SunburstChart as RechartsSunburstChart, Tooltip} from 'recharts';
import {ChartTooltip, ParentSize} from '../primitives';
import {getSeriesColor, useChartTheme} from '../theme';
import type {ChartTheme} from '../theme';
import type {ValueFormatter} from '../types';

export type SunburstNode = {
  name: string;
  value?: number;
  fill?: string;
  children?: SunburstNode[];
};

export type SunburstChartProps = {
  data: SunburstNode;
  height?: number;
  width?: number;
  innerRadius?: number;
  valueFormatter?: ValueFormatter;
};

function colorize(node: SunburstNode, theme: ChartTheme, inheritedFill?: string): SunburstNode {
  const fill = node.fill ?? inheritedFill ?? getSeriesColor(theme, node.name);
  const children = node.children?.map(child =>
    colorize(child, theme, node.children === undefined ? fill : (inheritedFill ?? getSeriesColor(theme, child.name))),
  );
  return {
    ...node,
    fill,
    value: node.value ?? children?.reduce((sum, child) => sum + (child.value ?? 0), 0),
    children,
  };
}

/**
 * Sunburst chart. Ideal for hierarchical spending visualization
 * (e.g. category -> subcategory -> merchant).
 */
export const SunburstChart: React.FC<SunburstChartProps> = ({
  data,
  height = 320,
  width,
  innerRadius = 40,
  valueFormatter,
}) => {
  const theme = useChartTheme();
  const coloredData = React.useMemo(() => colorize(data, theme), [data, theme]);

  return (
    <ParentSize width={width}>
      {({width: measured}) => (
        <RechartsSunburstChart
          width={measured}
          height={height}
          data={coloredData}
          dataKey="value"
          nameKey="name"
          innerRadius={innerRadius}
          stroke={theme.surface}
          textOptions={{fill: 'var(--bb-chart-on-color)', fontSize: '12px', fontWeight: '600'}}
        >
          <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
        </RechartsSunburstChart>
      )}
    </ParentSize>
  );
};
