import {type TStockPositionWithQuote, type TTimeframe} from '@budgetbuddyde/types';
import {AddRounded, ArrowForwardRounded} from '@mui/icons-material';
import {Button, IconButton, Stack, TableCell, TableRow, Typography} from '@mui/material';
import {format} from 'date-fns';
import React from 'react';
import {useNavigate} from 'react-router-dom';

import {AppConfig} from '@/app.config';
import {ActionPaper} from '@/components/Base/ActionPaper';
import {Image} from '@/components/Base/Image';
import {Menu} from '@/components/Base/Menu';
import {SearchInput} from '@/components/Base/SearchInput';
import {Table} from '@/components/Base/Table/Table.component';
import {StockPositionMenu, useStockPositions} from '@/features/Stocks';
import {Formatter} from '@/services/Formatter';
import {downloadAsJson} from '@/utils';

export type TStockPositionTableProps = {
  isLoading?: boolean;
  positions?: TStockPositionWithQuote[];
  onAddPosition?: () => void;
  onEditPosition?: (position: TStockPositionWithQuote) => void;
  onDeletePosition?: (position: TStockPositionWithQuote) => void;
  withRedirect?: boolean;
};

export const StockPositionTable: React.FC<TStockPositionTableProps> = ({
  isLoading = false,
  positions,
  onAddPosition,
  onEditPosition,
  onDeletePosition,
  withRedirect = false,
}) => {
  const navigate = useNavigate();
  const {isLoading: isLoadingStockPositions, data: stockPositions} = useStockPositions();
  const [keyword, setKeyword] = React.useState<string>('');

  const displayedStockPositions: TStockPositionWithQuote[] = React.useMemo(() => {
    if (!stockPositions) return [];
    const providedStockPositions = positions || stockPositions;
    if (keyword === '') return providedStockPositions;
    const lowerKeyword = keyword.toLowerCase();
    return providedStockPositions.filter(
      position =>
        position.name.toLowerCase().includes(lowerKeyword) || position.isin.toLowerCase().includes(lowerKeyword),
    );
  }, [keyword, stockPositions, positions]);

  return (
    <Table<TStockPositionWithQuote>
      title="Positions"
      subtitle="Click on a position to view more details."
      isLoading={isLoadingStockPositions || isLoading}
      data={displayedStockPositions}
      headerCells={['Asset', 'Buy in', 'Shares', 'Value', 'Profit (+/-)', '']}
      renderHeaderCell={cell => (
        <TableCell
          key={cell.replaceAll(' ', '_').toLowerCase()}
          size={AppConfig.table.cellSize}
          sx={{whiteSpace: 'nowrap'}}>
          <Typography fontWeight={'bold'} textAlign={'center'} noWrap>
            {cell}
          </Typography>
        </TableCell>
      )}
      renderRow={position => {
        const defaultTimeframe: TTimeframe = '3m';

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
                  backgroundColor: theme => theme.palette.action.hover,
                  cursor: 'pointer',
                },
              },
              onClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
                e.stopPropagation();
                navigate(`/stocks/${position.isin}?timeframe=${defaultTimeframe}`);
              },
            })}>
            <TableCell size={AppConfig.table.cellSize} sx={{minWidth: {xs: '250px', md: 'unset'}}}>
              <Stack direction="row" alignItems={'center'}>
                <ActionPaper
                  sx={{
                    minWidth: '40px',
                    width: '40px',
                    height: '40px',
                    mr: 1.5,
                  }}>
                  <Image src={position.logo} sx={{width: 'inherit', height: 'inherit'}} />
                </ActionPaper>

                <Stack>
                  <Stack direction="row" spacing={AppConfig.baseSpacing / 4}>
                    {/* <Typography variant="caption">{position.expand.exchange.symbol}</Typography> */}
                    <Typography variant="caption">{position.isin}</Typography>
                    {/* <Typography variant="caption">{'WKN'}</Typography> */}
                  </Stack>

                  <Typography variant="body1" fontWeight={'bolder'}>
                    {position.name}
                  </Typography>
                </Stack>
              </Stack>
            </TableCell>
            <TableCell size={AppConfig.table.cellSize}>
              <Stack sx={{textAlign: 'right'}}>
                <Typography fontWeight={'bolder'}>
                  {Formatter.formatBalance(position.quantity * position.buy_in, currency)}
                </Typography>
                <Typography variant="caption" fontWeight={'unset'}>
                  {Formatter.formatBalance(position.buy_in, currency)}
                </Typography>
              </Stack>
            </TableCell>
            <TableCell size={AppConfig.table.cellSize}>
              <Typography textAlign={'right'} noWrap>
                {position.quantity.toFixed(2)} x
              </Typography>
            </TableCell>
            <TableCell size={AppConfig.table.cellSize}>
              <Stack sx={{textAlign: 'right'}}>
                <Typography fontWeight={'bolder'}>
                  {Formatter.formatBalance(position.quantity * currentPrice)}
                </Typography>
                <Typography variant="caption" fontWeight={'unset'}>
                  {Formatter.formatBalance(currentPrice, currency)}
                </Typography>
              </Stack>
            </TableCell>
            <TableCell size={AppConfig.table.cellSize}>
              <Stack sx={{textAlign: 'right'}}>
                <Typography
                  sx={{
                    fontWeight: 'bolder',
                    color: theme => theme.palette[profit >= 0 ? 'success' : 'error'].main,
                  }}>
                  {Formatter.formatBalance(profit, currency)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{fontWeight: 'unset', color: theme => theme.palette[profit >= 0 ? 'success' : 'error'].main}}>
                  {profitPercentage.toFixed(2)} %
                </Typography>
              </Stack>
            </TableCell>
            <TableCell align="right">
              <ActionPaper sx={{display: 'flex', width: 'fit-content', ml: 'auto'}}>
                {(onEditPosition || onDeletePosition) && (
                  <StockPositionMenu
                    position={position}
                    onEditPosition={onEditPosition}
                    onDeletePosition={onDeletePosition}
                  />
                )}
                {withRedirect && (
                  <IconButton color="primary" onClick={() => navigate('/stocks/' + position.isin)}>
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
                    downloadAsJson(displayedStockPositions, `bb_stock_positions_${format(new Date(), 'yyyy_mm_dd')}`);
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
