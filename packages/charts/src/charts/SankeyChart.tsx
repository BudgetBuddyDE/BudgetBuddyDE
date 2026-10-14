'use client';

import React from 'react';
import {Sankey, Tooltip} from 'recharts';
import {ChartTooltip} from '../primitives';
import {ParentSize} from '../primitives/ParentSize';
import {getSeriesColor, useChartTheme} from '../theme';
import type {ValueFormatter} from '../types';

export type SankeyNodeData = {
  name: string;
};

export type SankeyLinkData = {
  source: number;
  target: number;
  value: number;
};

export type SankeyData = {
  nodes: SankeyNodeData[];
  links: SankeyLinkData[];
};

export type SankeyChartProps = {
  data: SankeyData;
  height?: number;
  width?: number;
  valueFormatter?: ValueFormatter;
  nodeWidth?: number;
  nodePadding?: number;
};

/**
 * Sankey diagram. Ideal for money flow: income -> categories -> merchants.
 */
export const SankeyChart: React.FC<SankeyChartProps> = ({
  data,
  height = 360,
  width,
  valueFormatter,
  nodeWidth = 14,
  nodePadding = 16,
}) => {
  const theme = useChartTheme();

  const renderNode = React.useCallback(
    (props: unknown): React.ReactElement => {
      const node = props as {
        x: number;
        y: number;
        width: number;
        height: number;
        index: number;
        payload: {name: string; value: number; depth: number};
      };
      const terminal = !data.links.some(link => link.source === node.index);
      return (
        <g>
          <rect
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            fill={getSeriesColor(theme, node.payload.name)}
            rx={3}
          />
          <text
            x={terminal ? node.x - 8 : node.x + node.width + 8}
            y={node.y + node.height / 2 - 4}
            textAnchor={terminal ? 'end' : 'start'}
            fill={theme.textColor}
            fontSize={12}
            fontWeight={500}
          >
            {node.payload.name}
            <tspan x={terminal ? node.x - 8 : node.x + node.width + 8} dy={16} fill={theme.axisTickFill}>
              {(valueFormatter ?? String)(node.payload.value)}
            </tspan>
          </text>
        </g>
      );
    },
    [theme, data.links, valueFormatter],
  );

  return (
    <ParentSize width={width}>
      {({width: measured}) => (
        <Sankey
          width={measured}
          height={height}
          data={data}
          nodeWidth={nodeWidth}
          nodePadding={nodePadding}
          linkCurvature={0.5}
          node={renderNode}
          link={{stroke: theme.axisLineStroke, strokeOpacity: 0.35}}
          margin={{top: 16, right: 16, bottom: 16, left: 16}}
        >
          <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
        </Sankey>
      )}
    </ParentSize>
  );
};
