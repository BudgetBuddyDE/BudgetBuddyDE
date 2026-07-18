'use client';

import DeleteRounded from '@mui/icons-material/DeleteRounded';
import {Chip, IconButton, Stack, Tooltip, Typography} from '@mui/material';
import React from 'react';
import type {ColumnDefinition} from '@/components/Table';
import {Formatter} from '@/utils/Formatter';
import type {ApiKey} from './types';
import {isExpired} from './utils';

export const useApiKeyTableColumns = (onDeleteApiKey: (apiKeyId: ApiKey['id']) => void) => {
  return React.useMemo<ColumnDefinition<ApiKey>[]>(
    () => [
      {
        key: 'enabled',
        label: 'Status',
        renderCell: (_value, row) => {
          const expired = isExpired(row.expiresAt);
          const label = !row.enabled ? 'Disabled' : expired ? 'Expired' : 'Active';

          return (
            <Chip
              label={label}
              size="small"
              color={!row.enabled || expired ? 'default' : 'success'}
              variant={!row.enabled || expired ? 'outlined' : 'filled'}
            />
          );
        },
      },
      {
        key: 'name',
        label: 'Name',
        renderCell: value => (
          <Typography variant="body2" fontWeight="medium">
            {(value as string | null) || 'Unnamed'}
          </Typography>
        ),
      },
      {
        key: 'prefix',
        label: 'Key',
        renderCell: (_value, row) => (
          <Typography variant="body2" color="text.secondary">
            {row.start ? `${row.start}...` : 'Hidden'}
          </Typography>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        renderCell: value => <Typography variant="body2">{Formatter.date.format(value as Date | string)}</Typography>,
      },
      {
        key: 'expiresAt',
        label: 'Expires',
        renderCell: value => (
          <Typography variant="body2">{Formatter.date.formatNullable(value as Date | string | null)}</Typography>
        ),
      },
      {
        key: 'lastRequest',
        label: 'Last request',
        renderCell: value => (
          <Typography variant="body2">{Formatter.date.formatNullable(value as Date | string | null)}</Typography>
        ),
      },
      {
        key: 'requestCount',
        label: 'Usage',
        renderCell: (_value, row) => (
          <Stack spacing={0.25}>
            <Typography variant="body2">{row.requestCount} requests</Typography>
            <Typography variant="caption" color="text.secondary">
              {row.remaining === null ? 'Unlimited remaining' : `${row.remaining} remaining`}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'rateLimitMax',
        label: 'Rate limit',
        renderCell: (_value, row) => {
          const window = Formatter.duration.formatMilliseconds(row.rateLimitTimeWindow);
          const limit = row.rateLimitEnabled && row.rateLimitMax ? `${row.rateLimitMax}/${window ?? 'window'}` : 'Off';

          return <Typography variant="body2">{limit}</Typography>;
        },
      },
      {
        key: 'id',
        label: '',
        align: 'right',
        renderCell: (_value, row) => (
          <Tooltip title="Delete API key">
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                onDeleteApiKey(row.id);
              }}
              aria-label={`Delete API key ${row.name || row.id}`}
            >
              <DeleteRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [onDeleteApiKey],
  );
};
