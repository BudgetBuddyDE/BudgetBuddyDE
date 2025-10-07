'use client';

import NextLink from 'next/link';
import { ArrowForwardRounded, EuroRounded } from '@mui/icons-material';
import {
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';
import { ActionPaper } from '@/components/ActionPaper';
import { Image } from '@/components/Image';
import { type Timeframe } from '../Dividend';
import { Formatter } from '@/utils/Formatter';
import { stockPositionSlice } from '@/lib/features/stocks/stockPositionSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logger } from '@/logger';
import {
  type TStockExchangeVH,
  type TStockPosition,
  type TExpandedStockPosition,
  TSearchAsset,
} from '@/types';
import { EntityMenu, EntityTable } from '@/components/Table/EntityTable';
import { useRouter } from 'next/navigation';
import {
  EntityDrawer,
  EntityDrawerField,
  EntityDrawerFormHandler,
  entityDrawerReducer,
  getInitialEntityDrawerState,
  type FirstLevelNullable,
} from '@/components/Drawer';
import { Command, useCommandPalette } from '@/components/CommandPalette';
import { StockExchangeService } from '@/services/Stock';
import { StockPositionService } from '@/services/Stock/StockPosition.service';

type EntityFormFields = FirstLevelNullable<
  Pick<
    TStockPosition,
    'ID' | 'isin' | 'quantity' | 'purchasePrice' | 'purchasedAt' | 'description'
  > & {
    toExchange: TStockExchangeVH;
  }
>;

export type StockPositionTableProps = {
  withRedirect?: boolean;
  redirectTimeframe?: Timeframe;
};

export const StockPositionTable: React.FC<StockPositionTableProps> = ({
  withRedirect = false,
  redirectTimeframe = '3m',
}) => {
  const { register: registerCommand, unregister: unregisterCommand } = useCommandPalette();
  const router = useRouter();
  const { refresh, getPage, setPage, setRowsPerPage, applyFilters } = stockPositionSlice.actions;
  const dispatch = useAppDispatch();
  const {
    status,
    error,
    currentPage,
    rowsPerPage,
    count: totalEntityCount,
    data: stockPositions,
    filter: filters,
  } = useAppSelector(stockPositionSlice.selectors.getState);
  const [drawerState, dispatchDrawerAction] = React.useReducer(
    entityDrawerReducer,
    getInitialEntityDrawerState<EntityFormFields>()
  );

  const closeEntityDrawer = () => {
    dispatchDrawerAction({ type: 'CLOSE' });
  };

  const handleFormSubmission: EntityDrawerFormHandler<EntityFormFields> = async (
    isPayloadMethod,
    onSuccess
  ) => {
    const action = drawerState.action;
  };

  const handleCreateEntity = () => {
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'CREATE',
      defaultValues: {
        purchasedAt: new Date(),
      },
    });
  };

  const handleEditEntity = ({
    ID,
    isin,
    purchasedAt,
    purchasePrice,
    description,
    quantity,
    toExchange: {
      name: exchangeName,
      symbol: exchangeSymbol,
      technicalName: technicalExchangeName,
    },
  }: TExpandedStockPosition) => {
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'EDIT',
      defaultValues: {
        ID,
        isin,
        purchasedAt,
        purchasePrice,
        description,
        quantity,
        toExchange: {
          name: exchangeName,
          symbol: exchangeSymbol,
          technicalName: technicalExchangeName,
        },
      },
    });
  };

  const handleDeleteEntity = async (entity: TExpandedStockPosition) => {
    // const [success, error] = await TransactionService.delete(entity.ID);
    // if (error || !success) {
    //   return showSnackbar({
    //     message: error.message,
    //     action: <Button onClick={() => handleDeleteEntity(entity)}>Retry</Button>,
    //   });
    // }
    // showSnackbar({ message: `Transaction deleted successfully` });
    // dispatch(refresh());
  };

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

  const EntityFormFields: EntityDrawerField<EntityFormFields>[] = React.useMemo(() => {
    return [
      {
        type: 'date',
        name: 'purchasedAt',
        label: 'Purchased at',
        required: true,
      },
      {
        type: 'autocomplete',
        name: 'toExchange',
        label: 'Exchange',
        placeholder: 'Select stock exchange',
        required: true,
        async retrieveOptionsFunc() {
          const [stockExchanges, error] = await StockExchangeService.getValueHelps();
          if (error) {
            logger.error('Failed to fetch stock exchange options:', error);
            return [];
          }
          return stockExchanges ?? [];
        },
        getOptionLabel(option: TStockExchangeVH) {
          return option.name;
        },
        isOptionEqualToValue(option: TStockExchangeVH, value: TStockExchangeVH) {
          return option.symbol === value.symbol;
        },
        noOptionsText: 'No stock exchanges found',
      },
      {
        type: 'autocomplete',
        name: 'isin',
        label: 'Asset',
        placeholder: 'Volkswagen (Vz)',
        required: true,
        async retrieveOptionsFunc(fieldText?: string) {
          console.log('StockPositionTable - Retrieving options for input:', fieldText);
          if (!fieldText || fieldText.length < 1) {
            console.log(
              'StockPositionTable - No input text provided, returning empty list of options'
            );
            return [];
          }

          const [searchResults, error] = await StockPositionService.search(fieldText || '');
          if (error) {
            logger.error(
              "Failed to fetch stock options with '%s' because of %s",
              fieldText,
              error.message,
              error
            );
            return [];
          }
          console.log(
            'StockPositionTable - Retrieved options for input:',
            fieldText,
            searchResults
          );

          return [
            {
              isin: 'DE0007664039',
              name: 'Volkswagen (Vz)',
              logoUrl: 'https://img.parqet.com/stocks/DE0007664005.svg',
            },
            {
              isin: 'DE0007664005',
              name: 'Volkswagen',
              logoUrl: 'https://img.parqet.com/stocks/DE0007664005.svg',
            },
            {
              isin: 'US9286626000',
              name: 'Volkswagen (ADR)',
              logoUrl: 'https://img.parqet.com/stocks/DE0007664005.svg',
            },
            {
              isin: 'XS1972548231',
              name: 'Volkswagen Financial Services AG 1.5%',
              logoUrl: 'https://img.parqet.com/assets/fallback.png',
            },
            {
              isin: 'US9286625010',
              name: 'VolkswagenPref. ADR',
              logoUrl: 'https://img.parqet.com/stocks2/US9286625010.png',
            },
            {
              isin: 'XS2837886105',
              name: 'Volkswagen Financial Services AG',
              logoUrl: 'https://img.parqet.com/assets/fallback.png',
            },
            {
              isin: 'AU3CB0306470',
              name: 'Volkswagen Financial Services Australia Ltd. 5.3%',
              logoUrl: 'https://img.parqet.com/assets/fallback.png',
            },
            {
              isin: 'CA918423AY04',
              name: 'Volkswagen Credit Canada Inc. 1.5%',
              logoUrl: 'https://img.parqet.com/assets/fallback.png',
            },
            {
              isin: 'CA918423BA19',
              name: 'Volkswagen Credit Canada Inc. 2.05%',
              logoUrl: 'https://img.parqet.com/assets/fallback.png',
            },
            {
              isin: 'XS2289841087',
              name: 'Volkswagen International Finance N.V. 1.5%',
              logoUrl: 'https://img.parqet.com/assets/fallback.png',
            },
          ];
        },
        getOptionLabel(option: TSearchAsset) {
          return option.name;
        },
        isOptionEqualToValue(option: TSearchAsset, value: TSearchAsset) {
          return option.isin === value.isin;
        },
        noOptionsText: 'No stock exchanges found',
      },
      {
        size: { xs: 12, md: 6 },
        type: 'number',
        name: 'quantity',
        label: 'Quantity',
        placeholder: '100',
        required: true,
        slotProps: {
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Chip
                  label="Share(s)"
                  variant="filled"
                  size="small"
                  sx={{ borderRadius: (theme) => theme.shape.borderRadius + 'px' }}
                />
              </InputAdornment>
            ),
          },
        },
      },
      {
        size: { xs: 12, md: 6 },
        type: 'number',
        name: 'purchasePrice',
        label: 'Purchase price',
        placeholder: '68.45',
        required: true,
        slotProps: {
          input: {
            endAdornment: <InputAdornment position="end">&euro;</InputAdornment>,
          },
        },
      },
    ] as EntityDrawerField<EntityFormFields>[];
  }, []);

  // Retrieve new data, every time the page is changed
  React.useEffect(() => {
    dispatch(
      getPage({
        page: currentPage,
        rowsPerPage: rowsPerPage,
      })
    );
  }, [dispatch, getPage, currentPage, rowsPerPage]);

  React.useEffect(() => {
    const commands: Command[] = [
      {
        id: 'add-stock-position',
        label: 'Add Stock Position',
        section: 'Stocks',
        // icon: <ReceiptRounded />,
        onSelect: () => {
          alert('Add Stock Position');
        },
      },
      {
        id: 'open-stock-watchlist',
        label: 'Open Stock Watchlist',
        section: 'Stocks',
        // icon: <ReceiptRounded />,
        onSelect: () => {
          alert('Open Stock Watchlist');
        },
      },
    ];
    registerCommand(commands);
    return () => unregisterCommand(commands.map((c) => c.id));
  }, []);

  return (
    <React.Fragment>
      <EntityTable<TExpandedStockPosition>
        title="Positions"
        subtitle="Click on a position to view more details."
        error={error}
        slots={{
          title: { showCount: true },
          noResults: {
            text: filters.keyword
              ? `No stock-positions found for "${filters.keyword}"`
              : 'No stock-positions found',
          },
          search: {
            enabled: true,
            placeholder: 'Search stock-positions…',
            onSearch: handleTextSearch,
          },
          create: { enabled: true, onClick: handleCreateEntity },
        }}
        totalEntityCount={totalEntityCount}
        isLoading={status === 'loading'}
        data={stockPositions}
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
          { key: 'isin', label: 'Asset', align: 'center' },
          { key: 'purchasePrice', label: 'Buy in', align: 'center' },
          { key: 'quantity', label: 'Shares', align: 'center' },
          { key: 'positionValue', label: 'Value', align: 'center' },
          { key: 'absoluteProfit', label: 'P/E', align: 'center' },
          { placeholder: true },
        ]}
        rowHeight={83.5}
        renderRow={(cell, position, list) => {
          const currency = 'EUR'; // REVISIT: make dynamic based on stock exchange
          const redirectPath = `/stocks/${position.isin}?timeframe=${redirectTimeframe}`;
          return (
            <TableRow key={position.ID}>
              <TableCell size={'medium'} sx={{ minWidth: { xs: '250px', md: 'unset' } }}>
                <Stack
                  sx={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: (theme) => theme.shape.borderRadius + 'px',
                    px: 0.5,
                    ':hover': {
                      backgroundColor: 'action.hover',
                      cursor: 'Pointer',
                    },
                  }}
                  onClick={() => router.push(redirectPath)}
                >
                  <ActionPaper
                    sx={{
                      minWidth: '40px',
                      width: '40px',
                      height: '40px',
                      mr: 1.5,
                    }}
                  >
                    <Image src={position.logoUrl} sx={{ width: 'inherit', height: 'inherit' }} />
                  </ActionPaper>

                  <Stack>
                    <Stack direction="row" spacing={2}>
                      {/* <Typography variant="caption">{'Symbol'}</Typography> */}
                      <Typography variant="caption">{position.isin}</Typography>
                      {/* <Typography variant="caption">{'WKN'}</Typography> */}
                    </Stack>

                    <Typography variant="body1" fontWeight={'bolder'}>
                      {position.securityName}
                    </Typography>
                  </Stack>
                </Stack>
              </TableCell>
              <TableCell size={'medium'}>
                <Stack sx={{ textAlign: 'right' }}>
                  <Typography fontWeight={'bolder'}>
                    {Formatter.currency.formatBalance(
                      position.quantity * position.purchasePrice,
                      currency
                    )}
                  </Typography>
                  <Typography variant="caption" fontWeight={'unset'}>
                    {Formatter.currency.formatBalance(position.purchasePrice, currency)}
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
                    {Formatter.currency.formatBalance(position.quantity * position.currentPrice)}
                  </Typography>
                  <Typography variant="caption" fontWeight={'unset'}>
                    {Formatter.currency.formatBalance(position.currentPrice, currency)}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell size={'medium'}>
                <Stack sx={{ textAlign: 'right' }}>
                  <Typography
                    sx={{
                      fontWeight: 'bolder',
                      color: (theme) =>
                        theme.palette[position.absoluteProfit >= 0 ? 'success' : 'error'].main,
                    }}
                  >
                    {Formatter.currency.formatBalance(position.absoluteProfit, currency)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 'unset',
                      color: (theme) =>
                        theme.palette[position.absoluteProfit >= 0 ? 'success' : 'error'].main,
                    }}
                  >
                    {position.relativeProfit.toFixed(2)} %
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="right">
                <EntityMenu<typeof position>
                  entity={position}
                  handleEditEntity={handleEditEntity}
                  handleDeleteEntity={handleDeleteEntity}
                >
                  {withRedirect && (
                    <IconButton color="primary" LinkComponent={NextLink} href={redirectPath}>
                      <ArrowForwardRounded />
                    </IconButton>
                  )}
                </EntityMenu>
              </TableCell>
            </TableRow>
          );
        }}
      />

      <EntityDrawer<EntityFormFields>
        title={'Stock Position'}
        subtitle={
          drawerState.action === 'CREATE' ? 'Add a new stock position' : 'Edit stock position'
        }
        open={drawerState.isOpen}
        onSubmit={handleFormSubmission}
        onClose={closeEntityDrawer}
        closeOnBackdropClick
        onResetForm={() => {
          return {
            ID: null,
            purchasedAt: new Date(),
            isin: null,
            description: null,
            purchasePrice: null,
            quantity: null,
            toExchange: null,
          };
        }}
        defaultValues={drawerState.defaultValues ?? undefined}
        fields={EntityFormFields}
      />
    </React.Fragment>
  );
};

// renderOption={(props, option, {selected}) => (
//   <StyledAutocompleteOption {...props} key={option.isin} selected={selected}>
//     <Grid container alignItems="center">
//       <Grid sx={{display: 'flex', width: '40px'}}>
//         <Image src={option.logo} alt={option.label + ' logo'} sx={{width: '40px', height: '40px'}} />
//       </Grid>
//       <Grid sx={{width: 'calc(100% - 44px)', wordWrap: 'break-word', pl: 1}}>
//         <Typography variant="body1">{option.label}</Typography>
//         <Typography variant="body2" color="text.secondary">
//           {option.type} - {option.isin}
//         </Typography>
//       </Grid>
//     </Grid>
//   </StyledAutocompleteOption>
// )}
