'use client';

import { ActionPaper } from '@/components/ActionPaper';
import { CategoryChip } from '@/components/Category/CategoryChip';
import { PaymentMethodChip } from '@/components/PaymentMethod/PaymentMethodChip';
import { EntityTable } from '@/components/Table/EntityTable';
import { subscriptionSlice } from '@/lib/features/subscriptions/subscriptionSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logger } from '@/logger';
import { type TExpandedSubscription } from '@/types';
import { Formatter } from '@/utils/Formatter';
import { MoreVertRounded } from '@mui/icons-material';
import { IconButton, Stack, TableCell, TableRow, Typography } from '@mui/material';
import React from 'react';

export type SubscriptionTableProps = {};

export const SubscriptionTable: React.FC<SubscriptionTableProps> = () => {
  const { getPage, setPage, setRowsPerPage, applyFilters } = subscriptionSlice.actions;
  const dispatch = useAppDispatch();
  const {
    status,
    error,
    currentPage,
    rowsPerPage,
    count: totalEntityCount,
    data: subscriptions,
    filter: filters,
  } = useAppSelector(subscriptionSlice.selectors.getState);

  const handleTextSearch = React.useCallback(
    (text: string) => {
      dispatch(
        applyFilters({
          keyword: text,
        })
      );
    },
    [applyFilters]
  );

  const dispatchNewPage = React.useCallback(
    (newPage: number) => {
      if (newPage < 0) {
        logger.warn('Tried to set page to a negative number, ignoring!');
        return;
      }

      dispatch(setPage(newPage));
    },
    [dispatch, setPage, rowsPerPage]
  );

  const dispatchNewRowsPerPage = React.useCallback(
    (newRowsPerPage: number) => {
      // TODO: Implement validation, in order to ensure that only an valid option is passed
      dispatch(setRowsPerPage(newRowsPerPage));
    },
    [dispatch, setRowsPerPage]
  );

  // Retrieve new data, every time the page is changed
  React.useEffect(() => {
    dispatch(
      getPage({
        page: currentPage,
        rowsPerPage: rowsPerPage,
      })
    );
  }, [dispatch, getPage, currentPage, rowsPerPage]);

  return (
    <EntityTable<TExpandedSubscription>
      title="Subscriptions"
      subtitle="Manage your recurring payments"
      error={error}
      slots={{
        title: { showCount: true },
        noResults: {
          text: filters.keyword
            ? `No subscriptions found for "${filters.keyword}"`
            : 'No subscriptions found',
        },
        search: {
          enabled: true,
          placeholder: 'Search subscriptions…',
          onSearch: handleTextSearch,
        },
      }}
      totalEntityCount={totalEntityCount}
      isLoading={status === 'loading'}
      data={subscriptions}
      dataKey={'ID'}
      pagination={{
        count: totalEntityCount,
        page: currentPage,
        rowsPerPage: rowsPerPage,
        onChangePage(newPage) {
          return dispatchNewPage(newPage);
        },
        onChangeRowsPerPage(newRowsPerPage) {
          return dispatchNewRowsPerPage(newRowsPerPage);
        },
      }}
      headerCells={[
        { key: 'nextExecution', label: 'Execute at' },
        { key: 'receiver', label: 'Details' },
        { key: 'transferAmount', label: 'Transfer Amount' },
        { key: 'information', label: 'Information' },
        { label: '', placeholder: true },
      ]}
      renderRow={(cell, item, data) => {
        const key = cell;
        const rowKey = String(item[key]);
        return (
          <TableRow key={rowKey}>
            <TableCell>
              <Typography
                variant="body1"
                sx={{
                  textDecoration: item.paused ? 'line-through' : 'unset',
                }}
              >
                {Formatter.date.format(item.nextExecution)}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body1">{item.receiver}</Typography>
              <Stack flexDirection={'row'}>
                <CategoryChip categoryName={item.toCategory.name} size="small" sx={{ mr: 1 }} />
                <PaymentMethodChip paymentMethodName={item.toPaymentMethod.name} size="small" />
              </Stack>
            </TableCell>
            <TableCell>
              <Typography variant="body1">
                {Formatter.currency.formatBalance(item.transferAmount)}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body1">{item.information}</Typography>
            </TableCell>
            <TableCell align="right">
              <ActionPaper sx={{ width: 'fit-content', ml: 'auto' }}>
                <IconButton>
                  <MoreVertRounded />
                </IconButton>
              </ActionPaper>
            </TableCell>
          </TableRow>
        );
      }}
    />
  );
};
