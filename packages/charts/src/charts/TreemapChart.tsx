'use client';

import React from 'react';
import {Tooltip, Treemap} from 'recharts';
import {ChartTooltip} from '../primitives';
import {ParentSize} from '../primitives/ParentSize';
import {getSeriesColor, useChartTheme} from '../theme';
import type {ValueFormatter} from '../types';

export type TreemapNode = {
  [key: string]: unknown;
  name: string;
  value?: number;
  children?: TreemapNode[];
  fill?: string;
};

export type TreemapChartProps = {
  data: TreemapNode[];
  height?: number;
  width?: number;
  valueFormatter?: ValueFormatter;
};

/**
 * Treemap chart. Ideal for hierarchical spending (category -> subcategory).
 */
export const TreemapChart: React.FC<TreemapChartProps> = ({data, height = 300, width, valueFormatter}) => {
  const theme = useChartTheme();
  const colorize = (node: TreemapNode, inherited?: string): TreemapNode => {
    const fill = node.fill ?? inherited ?? getSeriesColor(theme, node.name);
    return {...node, fill, children: node.children?.map(child => colorize(child, fill))};
  };

  const renderContent = React.useCallback(
    (props: unknown): React.ReactElement => {
      const node = props as {
        x: number;
        y: number;
        width: number;
        height: number;
        name?: string;
        depth?: number;
        index?: number;
        value?: number;
        fill?: string;
      };
      const {x, y, width: nodeWidth, height: nodeHeight, name, depth = 0, index = 0} = node;
      if (depth === 0 || ('children' in node && node.children)) return <g />;
      if (nodeWidth <= 0 || nodeHeight <= 0) return <g />;
      const fill = node.fill ?? getSeriesColor(theme, name ?? String(index));
      const textColor = 'var(--bb-chart-on-color)';
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={nodeWidth}
            height={nodeHeight}
            style={{fill, stroke: theme.surface, strokeWidth: 3}}
          />
          {nodeWidth > 64 && nodeHeight > 24 && (
            <text x={x + 8} y={y + 18} fill={textColor} fontSize={12} fontWeight={600}>
              {name?.slice(0, Math.max(1, Math.floor(nodeWidth / 7) - 2))}
            </text>
          )}
        </g>
      );
    },
    [theme],
  );

  return (
    <ParentSize width={width}>
      {({width: measured}) => (
        <Treemap
          width={measured}
          height={height}
          data={data.map(node => colorize(node))}
          dataKey="value"
          nameKey="name"
          aspectRatio={4 / 3}
          content={renderContent}
          isAnimationActive={false}
        >
          <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
        </Treemap>
      )}
    </ParentSize>
  );
};
