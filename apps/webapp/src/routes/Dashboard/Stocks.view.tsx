import {type TDividendDetails, TStockPositionWithQuote} from '@budgetbuddyde/types';
import {AccountBalanceRounded, AddRounded, PaymentsRounded, RemoveRounded} from '@mui/icons-material';
import {Button, Grid2 as Grid} from '@mui/material';
import React from 'react';
import {useNavigate} from 'react-router-dom';

import {AppConfig, Feature} from '@/app.config';
import {UseEntityDrawerDefaultState, useEntityDrawer} from '@/components/Drawer';
import {withFeatureFlag} from '@/components/Feature/withFeatureFlag/withFeatureFlag.component';
import {CircularProgress} from '@/components/Loading';
import {StatsCard} from '@/components/StatsCard/StatsCard.component';
import {useAuthContext} from '@/features/Auth';
import {DeleteDialog} from '@/features/DeleteDialog';
import {MetalQuoteList} from '@/features/Metals';
import {useSnackbarContext} from '@/features/Snackbar';
import {
  DividendTable,
  PortfolioDiversityChart,
  StockLayout,
  StockPositionDrawer,
  StockService,
  StockWatchlist,
  type TStockPositionDrawerValues,
  useFetchStockDividends,
  useStockPositions,
  useStockWatchlist,
} from '@/features/Stocks';
import {StockPositionTable} from '@/features/Stocks/StockPosition';
import {useDocumentTitle} from '@/hooks/useDocumentTitle';
import {Formatter} from '@/services/Formatter';
import {getSocketIOClient} from '@/utils';

interface IStocksHandler {
  showCreateDialog: (payload?: Partial<TStockPositionDrawerValues>) => void;
  showEditDialog: (stockPosition: TStockPositionWithQuote) => void;
  onCancelDeletePosition: () => void;
  onConfirmDeletePosition: () => void;
}

const StocksView = () => {
  const socket = getSocketIOClient();
  useDocumentTitle(`${AppConfig.appName} - Stocks`, true);
  const navigate = useNavigate();
  const {sessionUser} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const {
    isLoading: isLoadingStockPositions,
    data: stockPositions,
    updateQuote,
    refreshData: refreshStockPositions,
  } = useStockPositions();
  const {isLoading: isLoadingWatchlist, data: watchedAssets} = useStockWatchlist();
  const {
    loading: loadingDividends,
    dividends,
    refresh: refreshDividends,
  } = useFetchStockDividends((stockPositions ?? []).map(({isin}) => isin));
  const [stockPositionDrawer, dispatchStockPositionDrawer] = React.useReducer(
    useEntityDrawer<TStockPositionDrawerValues>,
    UseEntityDrawerDefaultState<TStockPositionDrawerValues>(),
  );
  const [showDeletePositionDialog, setShowDeletePositionDialog] = React.useState(false);
  const [deletePosition, setDeletePosition] = React.useState<TStockPositionWithQuote | null>(null);

  const depotValue: number = React.useMemo(() => {
    if (!stockPositions) return 0;
    return stockPositions.reduce((acc, position) => {
      return acc + position.quote.price * position.quantity;
    }, 0);
  }, [stockPositions]);

  const preparedDividends: TDividendDetails[] = React.useMemo(() => {
    if (!dividends) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return Object.entries(dividends).map(([_, dividendDetails]) => dividendDetails);
  }, [dividends]);

  const unrealisedProfits: {free: number; profit: number} = React.useMemo(() => {
    if (!stockPositions) return {free: 0, profit: 0};
    let free = 0;
    let profit = 0;
    stockPositions
      .filter(position => position.buy_in < position.quote.price)
      .forEach(position => {
        free += position.quantity * position.quote.price;
        profit += position.quantity * (position.quote.price - position.buy_in);
      });

    return {free, profit};
  }, [stockPositions]);

  const unrealisedLosses: {bound: number; loss: number} = React.useMemo(() => {
    if (!stockPositions) return {bound: 0, loss: 0};
    let bound = 0;
    let loss = 0;
    stockPositions
      .filter(position => position.buy_in > position.quote.price)
      .forEach(position => {
        bound += position.quantity * position.quote.price;
        loss += position.quantity * Math.abs(position.quote.price - position.buy_in);
      });

    return {bound, loss};
  }, [stockPositions]);

  const upcomingDividends: number = React.useMemo(() => {
    if (!dividends || !stockPositions || stockPositions.length === 0) return 0;
    return Object.entries(dividends)
      .flatMap(([_, dividendDetails]) => dividendDetails.futureDividends)
      .reduce((acc, dividend) => {
        if (!dividend) return acc;
        const matchingPositions = stockPositions.filter(({isin}) => isin === dividend.security);
        const totalStockQuantity = matchingPositions.reduce((acc, position) => acc + position.quantity, 0);
        if (totalStockQuantity <= 0) return acc;
        return acc + totalStockQuantity * dividend.price;
      }, 0);
  }, [dividends, stockPositions]);

  const handler: IStocksHandler = {
    showCreateDialog(payload) {
      dispatchStockPositionDrawer({type: 'OPEN', drawerAction: 'CREATE', payload: payload});
    },
    showEditDialog({id, bought_at, buy_in, quantity, currency, isin, name, logo, expand: {exchange}}) {
      dispatchStockPositionDrawer({
        type: 'OPEN',
        drawerAction: 'UPDATE',
        payload: {
          id,
          bought_at,
          currency,
          buy_in,
          exchange: {
            label: exchange.name,
            ticker: exchange.symbol,
            value: exchange.id,
          },
          quantity,
          stock: {
            type: 'Aktie',
            isin,
            label: name,
            logo,
          },
        },
      });
    },
    onCancelDeletePosition() {
      setDeletePosition(null);
      setShowDeletePositionDialog(false);
    },
    async onConfirmDeletePosition() {
      if (!deletePosition || !sessionUser) return;

      const [position, error] = await StockService.deletePosition({id: deletePosition.id});
      if (error) {
        showSnackbar({
          message: error.message,
          action: <Button onClick={() => handler.onConfirmDeletePosition()}>Retry</Button>,
        });
        console.error(error);
        return;
      }
      if (!position || !position.success) {
        showSnackbar({
          message: 'Error deleting position',
          action: <Button onClick={() => handler.onConfirmDeletePosition()}>Retry</Button>,
        });
        return;
      }

      showSnackbar({message: 'Position deleted'});
      setShowDeletePositionDialog(false);
      setDeletePosition(null);
      React.startTransition(() => {
        refreshStockPositions();
      });
    },
  };

  React.useEffect(() => {
    if (!sessionUser || isLoadingStockPositions || !stockPositions || (stockPositions && stockPositions.length === 0))
      return;
    const subscribedAssets: {isin: string; exchange: string}[] = [
      ...new Set(
        stockPositions.map(
          ({
            isin,
            expand: {
              exchange: {exchange},
            },
          }) => ({isin, exchange}),
        ),
      ),
    ];

    socket.connect();

    socket.emit('stock:subscribe', subscribedAssets, sessionUser.id);

    socket.on(
      `stock:update:${sessionUser.id}`,
      (data: {exchange: string; isin: string; quote: {datetime: string; currency: string; price: number}}) => {
        console.log('stock:update', data);
        updateQuote(data.exchange, data.isin, data.quote.price);
      },
    );

    const handleBeforeUnload = () => {
      socket.emit('stock:unsubscribe', subscribedAssets, sessionUser.id);
      socket.disconnect();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionUser, socket, stockPositions, isLoadingStockPositions]);

  React.useEffect(() => {
    if (!isLoadingStockPositions && stockPositions && stockPositions.length > 0) {
      refreshDividends();
    }
  }, [isLoadingStockPositions, stockPositions]);

  return (
    <StockLayout onSelectAsset={({identifier}) => navigate(`/stocks/${identifier}`)}>
      <Grid container size={{xs: 12}} spacing={AppConfig.baseSpacing}>
        {[
          {
            label: 'Depot',
            value: Formatter.formatBalance(depotValue),
            icon: <AccountBalanceRounded />,
            isLoading: isLoadingStockPositions,
            valueInformation: `Capital gain: ${Formatter.formatBalance(unrealisedProfits.profit - unrealisedLosses.loss)}`,
          },
          {
            label: 'Unrealised profits',
            value: Formatter.formatBalance(unrealisedProfits.profit),
            icon: <AddRounded />,
            isLoading: isLoadingStockPositions,
            valueInformation: `Free capital: ${Formatter.formatBalance(unrealisedProfits.free)}`,
          },
          {
            label: 'Unrealised losses',
            value: Formatter.formatBalance(unrealisedLosses.loss),
            icon: <RemoveRounded />,
            isLoading: isLoadingStockPositions,
            valueInformation: `Bound capital: ${Formatter.formatBalance(unrealisedLosses.bound)}`,
          },
          {
            label: 'Upcoming dividends',
            value: Formatter.formatBalance(upcomingDividends),
            icon: <PaymentsRounded />,
            isLoading: loadingDividends || isLoadingStockPositions,
            valueInformation: 'Expected upcoming dividend payments',
          },
        ].map(({value, valueInformation, icon, isLoading, label}) => (
          <Grid key={label.toLowerCase().replaceAll(' ', '_')} size={{xs: 6, md: 3}}>
            <StatsCard
              label={label}
              value={value}
              icon={icon}
              isLoading={isLoading}
              valueInformation={valueInformation}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container size={{xs: 12, md: 8}} spacing={AppConfig.baseSpacing} sx={{height: 'fit-content'}}>
        <Grid size={{xs: 12, md: 12}} order={{xs: 4}}>
          <StockPositionTable
            onAddPosition={handler.showCreateDialog}
            onEditPosition={handler.showEditDialog}
            onDeletePosition={position => {
              setShowDeletePositionDialog(true);
              setDeletePosition(position);
            }}
            withRedirect
          />
        </Grid>

        <Grid size={{xs: 12}} order={{xs: 5}}>
          <DividendTable dividends={preparedDividends} isLoading={loadingDividends} withRedirect />
        </Grid>
      </Grid>

      <Grid container size={{xs: 12, md: 4}} spacing={AppConfig.baseSpacing}>
        <Grid size={{xs: 12}}>
          {isLoadingStockPositions ? (
            <CircularProgress />
          ) : (
            <PortfolioDiversityChart positions={stockPositions ?? []} />
          )}
        </Grid>

        <Grid size={{xs: 12}}>
          <MetalQuoteList />
        </Grid>

        <Grid size={{xs: 12}}>
          {isLoadingWatchlist ? (
            <CircularProgress />
          ) : (
            <StockWatchlist title="Watchlist" subtitle="Watched assets" data={watchedAssets ?? []} />
          )}
        </Grid>
      </Grid>

      <StockPositionDrawer
        {...stockPositionDrawer}
        onClose={() => dispatchStockPositionDrawer({type: 'CLOSE'})}
        closeOnBackdropClick
        closeOnEscape
      />

      <DeleteDialog
        open={showDeletePositionDialog}
        onClose={handler.onCancelDeletePosition}
        onCancel={handler.onCancelDeletePosition}
        onConfirm={handler.onConfirmDeletePosition}
        withTransition
      />
    </StockLayout>
  );
};

export default withFeatureFlag(Feature.STOCKS, StocksView);
