import {type TStockPositionWithQuote} from '@budgetbuddyde/types';
import {TimelineRounded} from '@mui/icons-material';
import {Button, Grid2 as Grid} from '@mui/material';
import React from 'react';
import {Navigate, useNavigate, useParams} from 'react-router-dom';

import {Feature} from '@/app.config';
import {UseEntityDrawerDefaultState, useEntityDrawer} from '@/components/Drawer';
import {withFeatureFlag} from '@/components/Feature';
import {ContentGrid} from '@/components/Layout';
import {CircularProgress} from '@/components/Loading';
import {NoResults} from '@/components/NoResults';
import {useTimeframe} from '@/components/Timeframe';
import {useAuthContext, withAuthLayout} from '@/features/Auth';
import {DeleteDialog} from '@/features/DeleteDialog';
import {useSnackbarContext} from '@/features/Snackbar';
import {
  CompanyInformation,
  DividendList,
  FinancialStatementAccordion,
  KPIComponent,
  PriceChart,
  RelatedStockWrapper,
  StockLayout,
  StockNews,
  StockPositionDrawer,
  StockPositionTable,
  StockService,
  type TPriceChartPoint,
  type TStockPositionDrawerValues,
  useFetchStockDetails,
  useFetchStockQuotes,
  useStockPositions,
} from '@/features/Stocks';
import {AssetInfoAccordion} from '@/features/Stocks/AssetInfoAccordion';
import {useDocumentTitle} from '@/hooks/useDocumentTitle';
import {logger} from '@/logger';
import {getSocketIOClient} from '@/utils';

interface IStockHandler {
  showCreateDialog: (payload?: Partial<TStockPositionDrawerValues>) => void;
  showEditDialog: (stockPosition: TStockPositionWithQuote) => void;
  onSearch: (term: string) => void;
  onCancelDeletePosition: () => void;
  onConfirmDeletePosition: () => void;
}

export const Stock = () => {
  const navigate = useNavigate();
  const params = useParams<{isin: string}>();
  const [timeframe, setTimeframe] = useTimeframe();
  const {showSnackbar} = useSnackbarContext();
  const {session} = useAuthContext();
  const socket = getSocketIOClient();
  const [keyword, setKeyword] = React.useState('');

  if (!params.isin || params.isin.length !== 12) return <Navigate to={'/stocks'} />;

  const {
    loading: loadingDetails,
    details: stockDetails,
    refresh: refreshStockDetails,
  } = useFetchStockDetails(params.isin);
  useDocumentTitle(
    loadingDetails
      ? 'Loading...'
      : stockDetails
        ? `${stockDetails.asset.name} - ${params.isin}`
        : `Stock - ${params.isin}`,
    true,
  );
  const {
    loading: loadingQuotes,
    quotes,
    refresh: refreshQuotes,
    updateQuotes,
  } = useFetchStockQuotes([params.isin], 'langschwarz', timeframe);
  const {
    isLoading: loadingStockPositions,
    data: stockPositions,
    refreshData: refreshStockPositions,
    updateQuote,
  } = useStockPositions();
  const [stockPositionDrawer, dispatchStockPositionDrawer] = React.useReducer(
    useEntityDrawer<TStockPositionDrawerValues>,
    UseEntityDrawerDefaultState<TStockPositionDrawerValues>(),
  );
  const [showDeletePositionDialog, setShowDeletePositionDialog] = React.useState(false);
  const [deletePosition, setDeletePosition] = React.useState<TStockPositionWithQuote | null>(null);

  const preparedChartData: TPriceChartPoint[] = React.useMemo(() => {
    if (!quotes) return [];
    return quotes[0].quotes.map(({date, price}) => ({price, date}));
  }, [quotes]);

  const displayedStockPositions: TStockPositionWithQuote[] = React.useMemo(() => {
    if (!stockPositions) return [];
    if (keyword === '') return stockPositions.filter(({isin}) => isin === params.isin);
    const lowerKeyword = keyword.toLowerCase();
    return stockPositions.filter(
      position =>
        (position.name.toLowerCase().includes(lowerKeyword) || position.isin.toLowerCase().includes(lowerKeyword)) &&
        position.isin === params.isin,
    );
  }, [keyword, stockPositions, params]);

  const handler: IStockHandler = {
    showCreateDialog(payload) {
      dispatchStockPositionDrawer({
        type: 'OPEN',
        drawerAction: 'CREATE',
        payload: payload
          ? payload
          : stockDetails
            ? {
                stock: {
                  type: stockDetails.asset.assetType,
                  isin: stockDetails.asset._id.identifier,
                  label: stockDetails.asset.name ?? '',
                  logo: stockDetails.asset.logo,
                },
              }
            : undefined,
      });
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
    onSearch(term: string) {
      setKeyword(term);
    },
    onCancelDeletePosition() {
      setDeletePosition(null);
      setShowDeletePositionDialog(false);
    },
    async onConfirmDeletePosition() {
      if (!deletePosition || !session) return;
      const [position, error] = await StockService.deletePosition({id: deletePosition.id});
      if (error) {
        showSnackbar({
          message: error.message,
          action: <Button onClick={() => handler.onConfirmDeletePosition()}>Retry</Button>,
        });
        logger.error("Something wen't wrong", error);
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
    if (!params.isin || !session || loadingStockPositions || loadingQuotes || loadingDetails) return;
    socket.connect();

    socket.emit('stock:subscribe', [{isin: params.isin, exchange: 'langschwarz'}], session.user.id);

    const channel = `stock:update:${session.user.id}`;
    socket.on(
      channel,
      (data: {exchange: string; isin: string; quote: {datetime: string; currency: string; price: number}}) => {
        logger.debug(channel, data);
        updateQuote(data.exchange, data.isin, data.quote.price);
        updateQuotes(prev => {
          if (!prev) return prev;
          const quotes = prev[0].quotes;
          const idx = prev[0].quotes.length - 1;
          prev[0].quotes[idx] = {...quotes[idx], price: data.quote.price};
          return prev;
        });
      },
    );

    const handleBeforeUnload = () => {
      socket.emit('stock:unsubscribe', [{isin: params.isin, exchange: 'langschwarz'}], session.user.id);
      socket.disconnect();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [params, session]);

  React.useEffect(() => {
    refreshQuotes();
  }, [timeframe]);

  React.useEffect(() => {
    if (!params.isin || params.isin.length !== 12) return;
    refreshQuotes();
    refreshStockDetails();
    refreshStockPositions();
  }, [params.isin]);

  return (
    <StockLayout
      onSelectAsset={({identifier}) => navigate(`/stocks/${identifier}`)}
      onOpenPosition={({name, logo, identifier, type}) => {
        handler.showCreateDialog({stock: {type, isin: identifier, label: name, logo}});
      }}>
      <ContentGrid title={stockDetails?.asset.name ?? ''} description={params.isin} withNavigateBack>
        <Grid container size={{xs: 12, lg: 9}}>
          <Grid size={{xs: 12}}>
            {loadingQuotes && (!quotes || quotes.length === 0) ? (
              <CircularProgress />
            ) : quotes ? (
              <PriceChart
                company={{name: stockDetails?.asset.name ?? ''}}
                data={preparedChartData}
                onTimeframeChange={setTimeframe}
              />
            ) : (
              <NoResults icon={<TimelineRounded />} text="No quotes found" />
            )}
          </Grid>

          {stockDetails && (
            <Grid size={{xs: 12}}>
              <KPIComponent stockDetails={stockDetails} />
            </Grid>
          )}

          <Grid size={{xs: 12}}>
            <StockPositionTable
              isLoading={loadingStockPositions}
              positions={displayedStockPositions}
              onAddPosition={handler.showCreateDialog}
              onEditPosition={handler.showEditDialog}
              onDeletePosition={position => {
                setShowDeletePositionDialog(true);
                setDeletePosition(position);
              }}
            />
          </Grid>

          {stockDetails && (
            <Grid size={{xs: 12}}>
              <FinancialStatementAccordion stockDetails={stockDetails} />
            </Grid>
          )}

          <Grid size={{xs: 12}}>
            <RelatedStockWrapper isin={params.isin || ''} amount={6} />
          </Grid>
        </Grid>

        <Grid container size={{xs: 12, lg: 3}}>
          {loadingDetails ? (
            <Grid size={{xs: 12}}>
              <CircularProgress />
            </Grid>
          ) : (
            stockDetails && (
              <Grid size={{xs: 12}}>
                <CompanyInformation details={stockDetails} />
              </Grid>
            )
          )}

          {stockDetails?.asset.security.hasDividends &&
            (loadingDetails ? (
              <Grid size={{xs: 12}}>
                <CircularProgress />
              </Grid>
            ) : (
              stockDetails && (
                <Grid size={{xs: 12}}>
                  <DividendList dividends={stockDetails.details.futureDividends ?? []} />
                </Grid>
              )
            ))}

          {loadingDetails ? (
            <Grid size={{xs: 12}}>
              <CircularProgress />
            </Grid>
          ) : (
            stockDetails && (
              <Grid size={{xs: 12}}>
                <AssetInfoAccordion details={stockDetails} />
              </Grid>
            )
          )}

          {loadingDetails ? (
            <Grid size={{xs: 12}}>
              <CircularProgress />
            </Grid>
          ) : (
            stockDetails && (
              <Grid size={{xs: 12}}>
                <StockNews
                  news={stockDetails.details.news.map(({title, description, url}) => ({
                    heading: title,
                    summary: description,
                    link: url,
                  }))}
                />
              </Grid>
            )
          )}
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
      </ContentGrid>
    </StockLayout>
  );
};

export default withFeatureFlag(Feature.STOCKS, withAuthLayout(Stock));
