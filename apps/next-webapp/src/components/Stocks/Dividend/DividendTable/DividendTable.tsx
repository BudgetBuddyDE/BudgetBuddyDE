'use client';

import { Stack, TableCell, TableRow, Typography } from '@mui/material';
import React from 'react';
import { useRouter } from 'next/navigation';

import { ActionPaper } from '@/components/ActionPaper';
import { type TableProps, Table } from '@/components/Table';

const SEPERATOR = '•';

export type Timeframe = '1d' | '1w' | '1m' | '3m' | '6m' | '1y' | '3y' | '5y' | '10y' | 'max';
type DividendDetails = object;

export type DividendTableProps = {
  dividends: DividendDetails[];
  withRedirect?: boolean;
} & Pick<TableProps<DividendDetails>, 'isLoading'>;

export const DividendTable: React.FC<DividendTableProps> = ({
  dividends,
  withRedirect = false,
  ...tableProps
}) => {
  const router = useRouter();

  // FIXME: This is a placeholder for the stock positions, replace with actual data fetching logic
  // const futureDividends = React.useMemo(() => {
  //   return StockService.transformDividendDetails(dividends);
  // }, [dividends]);

  return (
    <Table<DividendDetails>
      data={[]}
      title="Dividends"
      subtitle="Upcoming dividend payments"
      headerCells={['Asset', 'Ex-Date', 'Payment-Date', 'Dividend', 'Total']}
      renderHeaderCell={(headerCell) => (
        <TableCell key={headerCell.replaceAll(' ', '_').toLowerCase()} size={'medium'}>
          <Typography fontWeight="bolder">{headerCell}</Typography>
        </TableCell>
      )}
      renderRow={(data) => {
        const defaultTimeframe: Timeframe = '3m';
        // const matchingPositions = (stockPositions ?? []).filter(
        //   (position) => position.isin === data.companyInfo?.security.isin
        // );
        // matchingPosition = Array(matchingPositions).at(-1);
        // const totalQuantity = matchingPositions.reduce((prev, cur) => prev + cur.quantity, 0);
        return (
          <TableRow
            // key={data.key + data.companyInfo.security.isin}
            {...(withRedirect && {
              sx: {
                ':hover': {
                  backgroundColor: (theme) => theme.palette.action.hover,
                  cursor: 'pointer',
                },
              },
              onClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
                e.stopPropagation();
                // FIXME: router.push(`/stocks/${data.companyInfo.security.isin}?timeframe=${defaultTimeframe}`);
              },
            })}
          >
            <TableCell>
              <Stack direction="row" alignItems={'center'}>
                <ActionPaper
                  sx={{
                    minWidth: '40px',
                    width: '40px',
                    height: '40px',
                    mr: 1.5,
                  }}
                >
                  {/* FIXME: <Image src={data.companyInfo.logo} sx={{ width: 'inherit', height: 'inherit' }} /> */}
                </ActionPaper>

                <Stack>
                  {/* <Stack direction="row" spacing={AppConfig.baseSpacing / 4}>
                    <Typography variant="caption">{data.companyInfo.security.type}</Typography>
                    <Typography variant="caption">{SEPERATOR}</Typography>
                    <Typography variant="caption">{data.companyInfo.security.isin}</Typography>
                    <Typography variant="caption">{SEPERATOR}</Typography>
                    <Typography variant="caption">{data.companyInfo.security.wkn}</Typography>
                  </Stack>

                  <Typography variant="body1" fontWeight={'bolder'}>
                    {data.companyInfo.name}
                  </Typography> */}
                </Stack>
              </Stack>
            </TableCell>
            <TableCell>
              {/* <Typography>{format(data.dividend.exDate, 'dd.MM.yy')}</Typography> */}
            </TableCell>
            <TableCell>
              {/* <Typography>{format(data.dividend.paymentDate, 'dd.MM.yy')}</Typography> */}
            </TableCell>
            <TableCell>
              {/* <Typography fontWeight={'bolder'}>
                {data.dividend.isEstimated ? '~' : ''}{' '}
                {Formatter.formatBalance(data.dividend.price, data.dividend.currency)}
              </Typography> */}
            </TableCell>
            <TableCell>
              {/* <Typography fontWeight={'bolder'}>
                {data.dividend.isEstimated ? '~' : ''}
                {Formatter.formatBalance(
                  totalQuantity * data.dividend.price,
                  data.dividend.currency
                )}
              </Typography> */}
            </TableCell>
          </TableRow>
        );
      }}
      {...tableProps}
      // isLoading={isLoadingStockPositions || tableProps.isLoading}
      isLoading={true}
    />
  );
};
