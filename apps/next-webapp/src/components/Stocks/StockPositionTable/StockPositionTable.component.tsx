'use client';

import { AddRounded, ArrowForwardRounded } from '@mui/icons-material';
import { Button, IconButton, Stack, TableCell, TableRow, Typography } from '@mui/material';
import { format } from 'date-fns';
import React from 'react';
import { useRouter } from 'next/navigation';

import { ActionPaper } from '@/components/ActionPaper';
import { Image } from '@/components/Image';
import { Menu } from '@/components/Menu';
import { SearchInput } from '@/components/Form/SearchInput';
import { Table } from '@/components/Table';
import { type Timeframe } from '../Dividend';
import { Formatter } from '@/utils/Formatter';
import { StockPositionMenu } from '../StockPositionMenu';
import { downloadAsJson } from '@/utils/downloadAsJson';

export type StockPositionTableProps = {
  isLoading?: boolean;
  positions?: any[];
  onAddPosition?: () => void;
  onEditPosition?: (position: any) => void;
  onDeletePosition?: (position: any) => void;
  withRedirect?: boolean;
};

export const StockPositionTable: React.FC<StockPositionTableProps> = ({
  isLoading = false,
  positions,
  onAddPosition,
  onEditPosition,
  onDeletePosition,
  withRedirect = false,
}) => {
  const router = useRouter();
  const [keyword, setKeyword] = React.useState<string>('');

  const displayedStockPositions: any[] = React.useMemo(() => {
    // if (!stockPositions) return [];
    // const providedStockPositions = positions || stockPositions;
    // if (keyword === '') return providedStockPositions;
    // const lowerKeyword = keyword.toLowerCase();
    // return providedStockPositions.filter(
    //   (position) =>
    //     position.name.toLowerCase().includes(lowerKeyword) ||
    //     position.isin.toLowerCase().includes(lowerKeyword)
    // );
    return [];
  }, [keyword, positions]);

  return (
    <Table<any>
      title="Positions"
      subtitle="Click on a position to view more details."
      isLoading={true}
      data={displayedStockPositions}
      headerCells={['Asset', 'Buy in', 'Shares', 'Value', 'Profit (+/-)', '']}
      renderHeaderCell={(cell) => (
        <TableCell
          key={cell.replaceAll(' ', '_').toLowerCase()}
          size={'medium'}
          sx={{ whiteSpace: 'nowrap' }}
        >
          <Typography fontWeight={'bold'} textAlign={'center'} noWrap>
            {cell}
          </Typography>
        </TableCell>
      )}
      renderRow={(position) => {
        const defaultTimeframe: Timeframe = '3m';

        const currency = position.quote.currency;
        const currentPrice = position.quote.price;

        const profit = position.quantity * currentPrice - position.quantity * position.buy_in;
        const profitPercentage = (profit / (position.quantity * position.buy_in)) * 100;
        return (
          <TableRow
            key={position.id}
            {...(withRedirect && {
              sx: {
                ':hover': {
                  backgroundColor: (theme) => theme.palette.action.hover,
                  cursor: 'pointer',
                },
              },
              onClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
                e.stopPropagation();
                router.push(`/stocks/${position.isin}?timeframe=${defaultTimeframe}`);
              },
            })}
          >
            <TableCell size={'medium'} sx={{ minWidth: { xs: '250px', md: 'unset' } }}>
              <Stack direction="row" alignItems={'center'}>
                <ActionPaper
                  sx={{
                    minWidth: '40px',
                    width: '40px',
                    height: '40px',
                    mr: 1.5,
                  }}
                >
                  <Image src={position.logo} sx={{ width: 'inherit', height: 'inherit' }} />
                </ActionPaper>

                <Stack>
                  {/* <Stack direction="row" spacing={AppConfig.baseSpacing / 4}>
                    <Typography variant="caption">{position.expand.exchange.symbol}</Typography>
                    <Typography variant="caption">{position.isin}</Typography>
                    <Typography variant="caption">{'WKN'}</Typography>
                  </Stack> */}

                  <Typography variant="body1" fontWeight={'bolder'}>
                    {position.name}
                  </Typography>
                </Stack>
              </Stack>
            </TableCell>
            <TableCell size={'medium'}>
              <Stack sx={{ textAlign: 'right' }}>
                <Typography fontWeight={'bolder'}>
                  {Formatter.currency.formatBalance(position.quantity * position.buy_in, currency)}
                </Typography>
                <Typography variant="caption" fontWeight={'unset'}>
                  {Formatter.currency.formatBalance(position.buy_in, currency)}
                </Typography>
              </Stack>
            </TableCell>
            <TableCell size={'medium'}>
              <Typography textAlign={'right'} noWrap>
                {position.quantity.toFixed(2)} x
              </Typography>
            </TableCell>
            <TableCell size={'medium'}>
              <Stack sx={{ textAlign: 'right' }}>
                <Typography fontWeight={'bolder'}>
                  {Formatter.currency.formatBalance(position.quantity * currentPrice)}
                </Typography>
                <Typography variant="caption" fontWeight={'unset'}>
                  {Formatter.currency.formatBalance(currentPrice, currency)}
                </Typography>
              </Stack>
            </TableCell>
            <TableCell size={'medium'}>
              <Stack sx={{ textAlign: 'right' }}>
                <Typography
                  sx={{
                    fontWeight: 'bolder',
                    color: (theme) => theme.palette[profit >= 0 ? 'success' : 'error'].main,
                  }}
                >
                  {Formatter.currency.formatBalance(profit, currency)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 'unset',
                    color: (theme) => theme.palette[profit >= 0 ? 'success' : 'error'].main,
                  }}
                >
                  {profitPercentage.toFixed(2)} %
                </Typography>
              </Stack>
            </TableCell>
            <TableCell align="right">
              <ActionPaper sx={{ display: 'flex', width: 'fit-content', ml: 'auto' }}>
                {(onEditPosition || onDeletePosition) && (
                  <StockPositionMenu
                    position={position}
                    onEditPosition={onEditPosition}
                    onDeletePosition={onDeletePosition}
                  />
                )}
                {withRedirect && (
                  <IconButton
                    color="primary"
                    onClick={() => router.push('/stocks/' + position.isin)}
                  >
                    <ArrowForwardRounded />
                  </IconButton>
                )}
              </ActionPaper>
            </TableCell>
          </TableRow>
        );
      }}
      tableActions={
        <React.Fragment>
          <SearchInput placeholder="Search position" onSearch={setKeyword} />
          {onAddPosition && (
            <IconButton color="primary" onClick={() => onAddPosition()}>
              <AddRounded fontSize="inherit" />
            </IconButton>
          )}
          {displayedStockPositions.length > 0 && (
            <Menu
              useIconButton
              actions={[
                {
                  children: 'Export',
                  onClick: () => {
                    downloadAsJson(
                      displayedStockPositions,
                      `bb_stock_positions_${format(new Date(), 'yyyy_mm_dd')}`
                    );
                  },
                },
              ]}
            />
          )}
        </React.Fragment>
      }
      noResultsMessage={
        <Typography textAlign={'center'}>
          No positions found.
          {onAddPosition && (
            <React.Fragment>
              <br /> Click on{' '}
              <Button startIcon={<AddRounded />} size="small" onClick={() => onAddPosition()}>
                Add
              </Button>{' '}
              to add a new position.
            </React.Fragment>
          )}
        </Typography>
      }
    />
  );
};
