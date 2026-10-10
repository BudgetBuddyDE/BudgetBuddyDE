'use client';

import {Box, Paper, Stack, Typography} from '@mui/material';
import React from 'react';
import type {ValueFormatter} from '../types';

export type ChartTooltipEntry = {
  name?: string | number;
  value?: number | string | null;
  color?: string;
  dataKey?: string | number;
  payload?: unknown;
};

export type ChartTooltipProps = {
  active?: boolean;
  label?: React.ReactNode;
  payload?: readonly ChartTooltipEntry[];
  valueFormatter?: ValueFormatter;
  seriesFormatters?: Record<string, ValueFormatter | undefined>;
  labelFormatter?: (label: unknown) => React.ReactNode;
};

/**
 * Theme aware tooltip used by the chart wrappers.
 *
 * Passed to Recharts via `<Tooltip content={<ChartTooltip ... />} />`; Recharts
 * clones the element and injects `active`, `payload` and `label`.
 */
export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
  seriesFormatters,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const entries = payload.filter(entry => entry.value !== null && entry.value !== undefined);
  if (entries.length === 0) return null;

  return (
    <Paper
      elevation={2}
      sx={{p: 1.5, minWidth: 190, maxWidth: 'min(320px, 85vw)', border: 1, borderColor: 'divider', borderRadius: 1.5}}
    >
      {label !== undefined && label !== null && label !== '' && (
        <Typography variant="body2" sx={{fontWeight: 600, display: 'block', mb: 1}}>
          {labelFormatter ? labelFormatter(label) : label}
        </Typography>
      )}
      <Stack spacing={0.25}>
        {entries.map((entry, index) => (
          <Stack
            key={`${entry.dataKey ?? entry.name ?? index}`}
            direction="row"
            spacing={1}
            sx={{alignItems: 'center'}}
          >
            <Box
              sx={{width: 10, height: 10, borderRadius: '3px', bgcolor: entry.color ?? 'text.disabled', flexShrink: 0}}
            />
            {entry.name !== undefined && (
              <Typography variant="body2" sx={{color: 'text.secondary'}}>
                {entry.name}
              </Typography>
            )}
            <Typography
              variant="body2"
              sx={{ml: 'auto', pl: 2, fontWeight: 600, fontVariantNumeric: 'tabular-nums', textAlign: 'right'}}
            >
              {typeof entry.value === 'number'
                ? (seriesFormatters?.[String(entry.dataKey)] ?? valueFormatter ?? String)(entry.value)
                : String(entry.value)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
};
