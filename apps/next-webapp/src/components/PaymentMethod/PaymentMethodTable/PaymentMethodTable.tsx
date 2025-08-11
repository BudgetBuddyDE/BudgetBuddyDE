'use client';

import { EntityTable } from '@/components/Table/EntityTable';
import { paymentMethodSlice } from '@/lib/features/paymentMethods/paymentMethodSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logger } from '@/logger';
import { type TPaymentMethod } from '@/types';
import { TableCell, TableRow, Typography } from '@mui/material';
import React from 'react';

export type PaymentMethodTableProps = {};

export const PaymentMethodTable: React.FC<PaymentMethodTableProps> = () => {
  const { getPage, setPage, setRowsPerPage, applyFilters } = paymentMethodSlice.actions;
  const dispatch = useAppDispatch();
  const {
    status,
    error,
    currentPage,
    rowsPerPage,
    count: totalEntityCount,
    data: paymentMethods,
    filter: filters,
  } = useAppSelector(paymentMethodSlice.selectors.getState);

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
    <EntityTable<TPaymentMethod>
      title="Payment Methods"
      subtitle="Manage your payment methods"
      error={error}
      slots={{
        title: { showCount: true },
        noResults: {
          text: filters.keyword
            ? `No payment methods found for "${filters.keyword}"`
            : 'No payment methods found',
        },
        search: {
          enabled: true,
          placeholder: 'Search payment methods…',
          onSearch: handleTextSearch,
        },
      }}
      totalEntityCount={totalEntityCount}
      isLoading={status === 'loading'}
      data={paymentMethods}
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
        { key: 'name', label: 'Name' },
        { key: 'address', label: 'Address' },
        { key: 'provider', label: 'Provider' },
        { key: 'description', label: 'Description' },
      ]}
      renderRow={(cell, item, data) => {
        const key = cell;
        const rowKey = String(item[key]);
        return (
          <TableRow key={rowKey}>
            <TableCell>
              <Typography variant="body1">{item.name}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body1">{item.address}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body1">{item.provider}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body1">{item.description || 'No description'}</Typography>
            </TableCell>
          </TableRow>
        );
      }}
    />
  );
};
