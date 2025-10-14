'use client';

import { TableCell, TableRow, Typography } from '@mui/material';
import React from 'react';
import { type TableProps, Table } from '@/components/Table';
import { AssetService } from '@/services/Stock';
import { type TDividend } from '@/types/Stocks/Dividend';
import { ErrorAlert } from '@/components/ErrorAlert';
import { Formatter } from '@/utils/Formatter';
import { useFetch } from '@/hooks/useFetch';

export type DividendTableProps = {
  identifiers?: string[];
  withRedirect?: boolean;
} & Pick<TableProps<TDividend>, 'isLoading'>;

export const DividendTable: React.FC<DividendTableProps> = ({
  identifiers = undefined,
  withRedirect = false,
  ...tableProps
}) => {
  const {
    isLoading,
    data: dividends,
    error,
  } = useFetch(async () => {
    const [dividendDetails, err] = await AssetService.dividends.get({
      future: true,
      historical: true,
    });
    if (err) throw err;
    return dividendDetails;
  });

  if (error) {
    return <ErrorAlert error={error} />;
  }
  return (
    <Table<TDividend>
      data={dividends!}
      isLoading={isLoading}
      title="Dividends"
      subtitle="Scheduled and past dividend payments"
      headerCells={['Ex-Date', 'Payment-Date', 'Dividend']}
      renderHeaderCell={(headerCell) => (
        <TableCell key={headerCell.replaceAll(' ', '_').toLowerCase()} size={'medium'}>
          <Typography fontWeight="bolder">{headerCell}</Typography>
        </TableCell>
      )}
      renderRow={({ price, exDate, paymentDate, isEstimated, currency }) => {
        return (
          <TableRow>
            <TableCell>
              <Typography>{Formatter.date.format(exDate)}</Typography>
            </TableCell>
            <TableCell>
              <Typography>{Formatter.date.format(paymentDate)}</Typography>
            </TableCell>
            <TableCell>
              <Typography fontWeight={'bolder'}>
                {isEstimated ? '~' : ''} {Formatter.currency.formatBalance(price, currency)}
              </Typography>
            </TableCell>
          </TableRow>
        );
      }}
      {...tableProps}
    />
  );
};
