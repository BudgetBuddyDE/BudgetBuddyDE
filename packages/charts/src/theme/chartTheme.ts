'use client';

import {useTheme} from '@mui/material/styles';
import type {SeriesRole} from '../types';

export const categoricalColors = [
  '#2563EB',
  '#0F766E',
  '#C2410C',
  '#7C3AED',
  '#A21CAF',
  '#4D7C0F',
  '#0369A1',
  '#9F1239',
  '#475569',
  '#854D0E',
  '#4338CA',
  '#00685E',
];
export const darkCategoricalColors = [
  '#82B4FF',
  '#5EEAD4',
  '#FDBA74',
  '#C4B5FD',
  '#F0ABFC',
  '#BEF264',
  '#7DD3FC',
  '#FDA4AF',
  '#CBD5E1',
  '#FDE68A',
  '#A5B4FC',
  '#99F6E4',
];

export type ChartTheme = {
  axisTickFill: string;
  axisLineStroke: string;
  gridStroke: string;
  textColor: string;
  surface: string;
  fontFamily: string;
  series: string[];
  semantic: Record<SeriesRole, string>;
};

// CSS variables switch SVG colors before hydration, without relying on palette.mode.
export function useChartTheme(): ChartTheme {
  const theme = useTheme();
  const palette = (theme.vars ?? theme).palette;
  return {
    axisTickFill: palette.text.secondary,
    axisLineStroke: palette.divider,
    gridStroke: palette.divider,
    textColor: palette.text.primary,
    surface: palette.background.paper,
    fontFamily: theme.typography.fontFamily ?? 'inherit',
    series: categoricalColors.map((color, index) => `var(--bb-chart-series-${index}, ${color})`),
    semantic: {
      balance: 'var(--bb-chart-balance, #2563EB)',
      income: 'var(--bb-chart-income, #0F766E)',
      expense: 'var(--bb-chart-expense, #C2410C)',
      target: 'var(--bb-chart-target, #64748B)',
      warning: 'var(--bb-chart-warning, #B42318)',
    },
  };
}

export function colorIndex(key: string, size = categoricalColors.length): number {
  let hash = 0;
  for (const character of key) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % size;
}

export function getSeriesColor(theme: ChartTheme, key: number | string, role?: SeriesRole): string {
  if (role) return theme.semantic[role];
  return theme.series[typeof key === 'number' ? key % theme.series.length : colorIndex(key, theme.series.length)];
}
