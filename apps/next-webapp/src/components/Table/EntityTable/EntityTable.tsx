'use client';

import { Card, type HeaderActionsProps } from '@/components/Card';
import { NoResults, NoResultsProps } from '@/components/NoResults';
import { Formatter } from '@/utils/Formatter';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import React from 'react';

export type EntityTableProps<T> = {
  title: string;
  subtitle?: string;
  slots?: Partial<{
    title: { showCount?: boolean };
    actions: HeaderActionsProps;
    noResults: NoResultsProps;
  }>;
  data: T[];
  dataKey: keyof T;
  headerCells: (keyof T | { key: keyof T; label: string } | { label: string; placeholder: true })[];
  renderHeaderCell?: (cell: keyof T, data: T[]) => React.ReactNode;
  renderRow: (cell: keyof T, item: T, data: T[]) => React.ReactNode;
};

export const EntityTable = <T,>({
  title,
  subtitle,
  data,
  dataKey,
  headerCells,
  renderHeaderCell,
  renderRow,
  slots,
}: EntityTableProps<T>) => {
  const ITEMS_IN_VIEW = 8; // Number of items to display in the table view
  const MAX_HEIGHT = 56 + 54 * ITEMS_IN_VIEW;
  const NO_RESULTS_TEXT = 'No items found';
  return (
    <Card sx={{ px: 0 }}>
      <Card.Header sx={{ px: 2 }}>
        <Box>
          <Card.Title>
            {title} {slots?.title?.showCount && `(${data.length})`}
          </Card.Title>
          {subtitle && subtitle.length > 0 && <Card.Subtitle>{subtitle}</Card.Subtitle>}
        </Box>
        <Card.HeaderActions {...slots?.actions}>title, subtitle, actions</Card.HeaderActions>
      </Card.Header>
      <Card.Body>
        {data.length == 0 && <NoResults text={NO_RESULTS_TEXT} {...slots?.noResults} />}
        {data.length > 0 && (
          <TableContainer sx={{ maxHeight: MAX_HEIGHT }}>
            <Table stickyHeader sx={{ tableLayout: 'auto' }}>
              <TableHead>
                <TableRow>
                  {headerCells.map((cell) => {
                    const isBasicKey = typeof cell !== 'object';
                    const key = isBasicKey
                      ? cell
                      : 'key' in cell
                      ? cell.key
                      : cell.label.toLowerCase().replaceAll(' ', '-');
                    if (renderHeaderCell) {
                      return renderHeaderCell(key as keyof T, data);
                    }
                    const label = isBasicKey ? String(cell) : cell.label;
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
      <Card.Footer sx={{ px: 2 }}>Pagination</Card.Footer>
    </Card>
  );
};
