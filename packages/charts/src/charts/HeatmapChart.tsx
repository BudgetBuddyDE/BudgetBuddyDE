'use client';

import {Box, Typography} from '@mui/material';
import React from 'react';
import {ParentSize} from '../primitives';
import type {ValueFormatter} from '../types';

export type HeatmapDataPoint = {x: string; y: string; value: number | null};
export type HeatmapChartProps = {
  data: HeatmapDataPoint[];
  xLabels: string[];
  yLabels: string[];
  height?: number;
  width?: number;
  valueFormatter?: ValueFormatter;
  lowColor?: string;
  highColor?: string;
  /** Explicit click or keyboard-focus selection. Does not navigate. */
  onSelect?: (point: HeatmapDataPoint) => void;
};

export function HeatmapChart({
  data,
  xLabels,
  yLabels,
  height = 300,
  width,
  valueFormatter = String,
  lowColor = 'var(--bb-chart-heat-low)',
  highColor = 'var(--bb-chart-heat-high)',
  onSelect,
}: HeatmapChartProps) {
  const [selected, setSelected] = React.useState<string>();
  const lookup = React.useMemo(
    () => new Map(data.map(point => [JSON.stringify([point.x, point.y]), point.value])),
    [data],
  );
  const values = data.flatMap(point => (point.value !== null && Number.isFinite(point.value) ? [point.value] : []));
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [focusIndex, setFocusIndex] = React.useState(0);
  const details = selected ? data.find(point => JSON.stringify([point.x, point.y]) === selected) : undefined;

  return (
    <ParentSize width={width}>
      {() => (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `48px repeat(${Math.max(1, xLabels.length)}, minmax(0, 1fr))`,
              gap: 0.5,
            }}
          >
            <Box />
            {xLabels.map(label => (
              <Typography key={label} variant="caption" sx={{textAlign: 'center'}}>
                {label}
              </Typography>
            ))}
            {yLabels.map((y, row) => (
              <React.Fragment key={y}>
                <Typography variant="caption" sx={{alignSelf: 'center'}}>
                  {y}
                </Typography>
                {xLabels.map((x, column) => {
                  const key = JSON.stringify([x, y]);
                  const value = lookup.get(key);
                  const missing = value === undefined || value === null || !Number.isFinite(value);
                  const ratio = missing || max === min ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
                  const index = row * xLabels.length + column;
                  return (
                    <Box
                      component="button"
                      key={key}
                      ref={(element: HTMLButtonElement | null) => {
                        refs.current[index] = element;
                      }}
                      type="button"
                      tabIndex={focusIndex === index ? 0 : -1}
                      aria-label={`${y}, ${x}: ${missing ? 'No data' : valueFormatter(value)}`}
                      onFocus={() => {
                        setFocusIndex(index);
                        setSelected(key);
                        onSelect?.({x, y, value: missing ? null : value});
                      }}
                      onClick={() => {
                        setSelected(key);
                        onSelect?.({x, y, value: missing ? null : value});
                      }}
                      onMouseEnter={() => setSelected(key)}
                      onKeyDown={event => {
                        const offsets: Record<string, number> = {
                          ArrowRight: 1,
                          ArrowLeft: -1,
                          ArrowDown: xLabels.length,
                          ArrowUp: -xLabels.length,
                        };
                        if (event.key in offsets) {
                          event.preventDefault();
                          refs.current[
                            Math.max(0, Math.min(refs.current.length - 1, index + offsets[event.key]))
                          ]?.focus();
                        }
                      }}
                      sx={{
                        height: Math.max(28, Math.min(56, height / Math.max(1, yLabels.length))),
                        minWidth: 0,
                        cursor: 'pointer',
                        border: 1,
                        borderColor: missing ? 'divider' : 'transparent',
                        borderRadius: 0.5,
                        bgcolor: missing
                          ? 'action.hover'
                          : `color-mix(in srgb, ${highColor} ${Math.round(ratio * 100)}%, ${lowColor})`,
                        backgroundImage: missing
                          ? 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(127,127,127,0.18) 4px, rgba(127,127,127,0.18) 5px)'
                          : 'none',
                      }}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </Box>
          <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mt: 1.5}}>
            <Typography variant="caption">{valueFormatter(min)}</Typography>
            <Box
              aria-hidden
              sx={{
                flex: 1,
                maxWidth: 140,
                height: 8,
                borderRadius: 0.5,
                background: `linear-gradient(90deg, ${lowColor}, ${highColor})`,
              }}
            />
            <Typography variant="caption">{valueFormatter(max)}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ml: 'auto'}}>
              Hatched: no data
            </Typography>
          </Box>
          <Typography variant="body2" aria-live="polite" sx={{minHeight: 24, mt: 1}}>
            {selected
              ? `${JSON.parse(selected).join(', ')}: ${details?.value === null || details?.value === undefined ? 'No data' : valueFormatter(details.value)}`
              : 'Select a cell to see the exact amount.'}
          </Typography>
        </>
      )}
    </ParentSize>
  );
}
