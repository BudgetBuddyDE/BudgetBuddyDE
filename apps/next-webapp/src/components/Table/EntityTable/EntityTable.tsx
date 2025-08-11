'use client';

import { Card, type HeaderActionsProps } from '@/components/Card';
import { NoResults, type NoResultsProps } from '@/components/NoResults';
import {
  Box,
  IconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  type IconButtonProps,
} from '@mui/material';
import React from 'react';
import { ErrorAlert, type ErrorAlertProps } from '@/components/ErrorAlert';
import { CircularProgress } from '@/components/Loading';
import { ActionPaper } from '@/components/ActionPaper';
import { Pagination, type PaginationProps } from './Pagination';
import { SearchInput, type SearchInputProps } from '@/components/Form/SearchInput';
import { AddRounded, CloudDownloadRounded } from '@mui/icons-material';

export type EntityTableProps<T> = {
  title: string;
  subtitle?: string;
  slots?: Partial<{
    title: { showCount?: boolean };
    actions: HeaderActionsProps;
    create: IconButtonProps & { enabled: boolean };
    export: IconButtonProps & { enabled: boolean };
    noResults: NoResultsProps;
    error: Omit<ErrorAlertProps, 'error'>;
    search: SearchInputProps & { enabled: boolean };
  }>;
  isLoading?: boolean;
  data: T[];
  totalEntityCount?: number;
  dataKey: keyof T;
  headerCells: (keyof T | { key: keyof T; label: string } | { placeholder: true })[];
  renderHeaderCell?: (cell: keyof T, data: T[]) => React.ReactNode;
  renderRow: (cell: keyof T, item: T, data: T[]) => React.ReactNode;
  error?: ErrorAlertProps['error'];
  pagination: PaginationProps;
};

export const ITEMS_IN_VIEW = 8; // Number of items to display in the table view

export const EntityTable = <T,>({
  title,
  subtitle,
  isLoading = false,
  data,
  totalEntityCount,
  dataKey,
  headerCells,
  renderHeaderCell,
  renderRow,
  slots,
  error,
  pagination,
}: EntityTableProps<T>) => {
  const MAX_HEIGHT = 56 + 58 * ITEMS_IN_VIEW;
  const NO_RESULTS_TEXT = 'No items found';
  const hasError = !!(
    error &&
    (typeof error == 'object' || (typeof error == 'string' && error.length > 0))
  );
  return (
    <Card sx={{ px: 0 }}>
      <Card.Header sx={{ px: 2 }}>
        <Box>
          <Card.Title>
            {title} {slots?.title?.showCount && `(${totalEntityCount || data.length})`}
          </Card.Title>
          {subtitle && subtitle.length > 0 && <Card.Subtitle>{subtitle}</Card.Subtitle>}
        </Box>
        <Card.HeaderActions {...slots?.actions}>
          <ActionPaper sx={{ display: 'flex', flexDirection: 'row' }}>
            {isLoading && data.length == 0 ? (
              <Skeleton
                variant="rounded"
                sx={{ width: { xs: '5rem', md: '10rem' }, height: '2.3rem' }}
              />
            ) : (
              <React.Fragment>
                {slots?.search && slots.search.enabled && <SearchInput {...slots.search} />}
                {slots?.create && slots.create.enabled && (
                  <Tooltip title="Create entity" placement="bottom">
                    <IconButton color="primary" {...slots.create}>
                      <AddRounded fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                )}
                {slots?.export && slots.export.enabled && (
                  <Tooltip title="Export entities" placement="bottom">
                    <IconButton color="primary" {...slots.export}>
                      <CloudDownloadRounded fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                )}
              </React.Fragment>
            )}
          </ActionPaper>
        </Card.HeaderActions>
      </Card.Header>
      <Card.Body>
        {!isLoading && !hasError && data.length == 0 && (
          <NoResults
            text={NO_RESULTS_TEXT}
            {...slots?.noResults}
            sx={{ m: 2, ...slots?.noResults?.sx }}
          />
        )}

        {hasError && (
          <ErrorAlert error={error} {...slots?.error} sx={{ m: 2, ...slots?.error?.sx }} />
        )}

        {isLoading && data.length == 0 && <CircularProgress />}

        {data.length > 0 && (
          <TableContainer sx={{ maxHeight: MAX_HEIGHT }}>
            <Table stickyHeader sx={{ tableLayout: 'auto', backgroundColor: 'unset' }}>
              <TableHead>
                <TableRow>
                  {headerCells.map((cell) => {
                    const isBasicKey = typeof cell !== 'object';
                    const key = isBasicKey ? cell : 'key' in cell ? cell.key : ''; // it's a placegolder cell
                    if (renderHeaderCell) {
                      return renderHeaderCell(key as keyof T, data);
                    }
                    const label = isBasicKey ? String(cell) : 'label' in cell ? cell.label : '';
                    return (
                      <TableCell key={typeof key === 'string' ? key : key.toString()}>
                        {label}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item, idx, dataList) => {
                  const key = dataKey;
                  return renderRow(key, item, dataList);
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card.Body>
      <Card.Footer sx={{ px: 2 }}>
        <ActionPaper sx={{ width: 'fit-content', ml: 'auto', mt: 2 }}>
          <Pagination {...pagination} />
        </ActionPaper>
      </Card.Footer>
    </Card>
  );
};
