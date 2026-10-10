'use client';

import {Box, Stack, Typography} from '@mui/material';
import React from 'react';
import {ParentSize} from '../primitives';
import {useChartTheme} from '../theme';
import type {ValueFormatter} from '../types';

export type BulletDataPoint = {label: string; actual: number; target: number; max: number};
export type BulletChartProps = {
  data: BulletDataPoint[];
  height?: number;
  width?: number;
  valueFormatter?: ValueFormatter;
};

export function BulletChart({data, width, valueFormatter = String}: BulletChartProps) {
  const theme = useChartTheme();
  return (
    <ParentSize width={width}>
      {() => (
        <Stack spacing={2}>
          {data.map(point => {
            const max = Math.max(1, point.max, point.target, point.actual);
            return (
              <Box key={point.label}>
                <Stack direction="row" sx={{justifyContent: 'space-between', gap: 2, mb: 0.75}}>
                  <Typography variant="body2">{point.label}</Typography>
                  <Typography variant="body2" sx={{fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>
                    {valueFormatter(point.actual)}
                  </Typography>
                </Stack>
                <Box
                  role="img"
                  aria-label={`${point.label}: ${valueFormatter(point.actual)}; target ${valueFormatter(point.target)}`}
                  sx={{height: 12, bgcolor: theme.gridStroke, borderRadius: 1, position: 'relative'}}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${Math.max(0, point.actual / max) * 100}%`,
                      bgcolor: point.actual > point.target ? theme.semantic.warning : theme.semantic.balance,
                      borderRadius: 1,
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -4,
                      height: 20,
                      width: 2,
                      left: `${Math.max(0, point.target / max) * 100}%`,
                      bgcolor: theme.semantic.target,
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{mt: 0.75}}>
                  Target {valueFormatter(point.target)}
                  {point.actual > point.target ? ' (exceeded)' : ''}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      )}
    </ParentSize>
  );
}
