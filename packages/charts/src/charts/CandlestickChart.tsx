'use client';

import {Typography} from '@mui/material';
import React from 'react';
import {ParentSize} from '../primitives/ParentSize';
import {useChartTheme} from '../theme';
import type {ValueFormatter} from '../types';

export type CandlestickDataPoint = {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type CandlestickChartProps = {
  data: CandlestickDataPoint[];
  height?: number;
  width?: number;
  valueFormatter?: ValueFormatter;
};

const LEFT_AXIS_WIDTH = 68;
const BOTTOM_AXIS_HEIGHT = 24;
const TOP_PADDING = 8;
const GRID_LINES = 4;

/**
 * Candlestick / OHLC chart for investments.
 *
 * Recharts has no native candlestick, so this renders a themed SVG. Ideal for
 * portfolio and asset price history.
 */
export const CandlestickChart: React.FC<CandlestickChartProps> = ({data, height = 320, width, valueFormatter}) => {
  const theme = useChartTheme();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const refs = React.useRef<(SVGGElement | null)[]>([]);

  return (
    <ParentSize width={width}>
      {({width: measured}) => {
        const chartWidth = measured;
        const plotWidth = Math.max(0, chartWidth - LEFT_AXIS_WIDTH);
        const plotHeight = Math.max(0, height - BOTTOM_AXIS_HEIGHT - TOP_PADDING);
        const highs = data.map(point => point.high);
        const lows = data.map(point => point.low);
        const padding = highs.length ? Math.max(1, (Math.max(...highs) - Math.min(...lows)) * 0.08) : 0;
        const max = highs.length > 0 ? Math.max(...highs) + padding : 1;
        const min = lows.length > 0 ? Math.min(...lows) - padding : 0;
        const range = max - min === 0 ? 1 : max - min;
        const step = data.length > 0 ? plotWidth / data.length : plotWidth;
        const candleWidth = Math.max(2, step * 0.6);

        const yOf = (value: number) => TOP_PADDING + ((max - value) / range) * plotHeight;

        return (
          <>
            <svg
              width={chartWidth}
              height={height}
              role="group"
              aria-label="Price history: hollow candles rise, filled candles fall"
            >
              {Array.from({length: GRID_LINES + 1}, (_, index) => {
                const value = min + range * (index / GRID_LINES);
                const y = yOf(value);
                return (
                  <g key={index}>
                    <line
                      x1={LEFT_AXIS_WIDTH}
                      x2={chartWidth}
                      y1={y}
                      y2={y}
                      stroke={theme.gridStroke}
                      strokeDasharray="4 2"
                    />
                    <text
                      x={LEFT_AXIS_WIDTH - 8}
                      y={y}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize={11}
                      fill={theme.axisTickFill}
                    >
                      {valueFormatter ? valueFormatter(value) : Math.round(value)}
                    </text>
                  </g>
                );
              })}
              {data.map((point, index) => {
                const centerX = LEFT_AXIS_WIDTH + step * index + step / 2;
                const isUp = point.close >= point.open;
                const color = isUp ? theme.semantic.income : theme.semantic.expense;
                const bodyTop = yOf(Math.max(point.open, point.close));
                const bodyBottom = yOf(Math.min(point.open, point.close));
                return (
                  <g
                    key={point.label}
                    ref={element => {
                      refs.current[index] = element;
                    }}
                    tabIndex={index === activeIndex ? 0 : -1}
                    role="img"
                    aria-label={`${point.label}: open ${(valueFormatter ?? String)(point.open)}, high ${(valueFormatter ?? String)(point.high)}, low ${(valueFormatter ?? String)(point.low)}, close ${(valueFormatter ?? String)(point.close)}`}
                    onFocus={() => setActiveIndex(index)}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => setActiveIndex(index)}
                    onKeyDown={event => {
                      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                        event.preventDefault();
                        refs.current[
                          Math.max(0, Math.min(data.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)))
                        ]?.focus();
                      }
                    }}
                  >
                    <line
                      x1={centerX}
                      x2={centerX}
                      y1={yOf(point.high)}
                      y2={yOf(point.low)}
                      stroke={color}
                      strokeWidth={1.5}
                    />
                    <rect
                      x={centerX - candleWidth / 2}
                      y={bodyTop}
                      width={candleWidth}
                      height={Math.max(1, bodyBottom - bodyTop)}
                      fill={isUp ? theme.surface : color}
                      stroke={color}
                      strokeWidth={2}
                      rx={1}
                    />
                  </g>
                );
              })}
              {data.map((point, index) => {
                if (index % Math.max(1, Math.ceil(data.length / Math.max(1, plotWidth / 48))) !== 0) return null;
                const centerX = LEFT_AXIS_WIDTH + step * index + step / 2;
                return (
                  <text
                    key={point.label}
                    x={centerX}
                    y={height - 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11}
                    fill={theme.axisTickFill}
                  >
                    {point.label}
                  </text>
                );
              })}
            </svg>
            <Typography variant="body2" aria-live="polite">
              {data[activeIndex] &&
                `${data[activeIndex].label}: Open ${(valueFormatter ?? String)(data[activeIndex].open)}, High ${(valueFormatter ?? String)(data[activeIndex].high)}, Low ${(valueFormatter ?? String)(data[activeIndex].low)}, Close ${(valueFormatter ?? String)(data[activeIndex].close)}`}
            </Typography>
          </>
        );
      }}
    </ParentSize>
  );
};
