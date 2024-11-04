import {type TStockPositionWithQuote} from '@budgetbuddyde/types';
import {ExpandMoreRounded, HelpOutlineRounded, TimelineRounded} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Grid2 as Grid,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import {format} from 'date-fns';
import React from 'react';
import {Navigate, useNavigate, useParams} from 'react-router-dom';

import {AppConfig, Feature} from '@/app.config';
import {Card} from '@/components/Base/Card';
import {PieChart} from '@/components/Base/Charts';
import {BarChart, TBarChartProps} from '@/components/Base/Charts/BarChart/BarChart.component';
import {UseEntityDrawerDefaultState, useEntityDrawer} from '@/components/Drawer/EntityDrawer';
import {withFeatureFlag} from '@/components/Feature/withFeatureFlag/withFeatureFlag.component';
import {ContentGrid} from '@/components/Layout';
import {CircularProgress} from '@/components/Loading';
import {NoResults} from '@/components/NoResults';
import {TabPanel} from '@/components/TabPanel';
import {useTimeframe} from '@/components/Timeframe';
import {useAuthContext, withAuthLayout} from '@/features/Auth';
import {DeleteDialog} from '@/features/DeleteDialog';
import {useSnackbarContext} from '@/features/Snackbar';
import {
  CompanyInformation,
  DividendList,
  PriceChart,
  RelatedStock,
  StockLayout,
  StockNews,
  StockPositionDrawer,
  StockPositionTable,
  StockRating,
  StockService,
  type TPriceChartPoint,
  type TStockPositionDrawerValues,
  useFetchRelatedStocks,
  useFetchStockDetails,
  useFetchStockQuotes,
  useStockPositions,
} from '@/features/Stocks';
import {useDocumentTitle} from '@/hooks/useDocumentTitle';
import {Formatter} from '@/services/Formatter';
import {getSocketIOClient} from '@/utils';

const NoStockMessage = () => (
  <Card>
    <NoResults icon={<HelpOutlineRounded />} text="No information found!" />
  </Card>
);

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
  const {sessionUser} = useAuthContext();
  const socket = getSocketIOClient();
  const [keyword, setKeyword] = React.useState('');
  const [tabPane, setTabPane] = React.useState({profit: 0, financial: 0});
  const {
    loading: loadingDetails,
    details: stockDetails,
    refresh: refreshStockDetails,
  } = useFetchStockDetails(params.isin || '');
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
  } = useFetchStockQuotes([params.isin || ''], 'langschwarz', timeframe);
  const {
    isLoading: loadingStockPositions,
    data: stockPositions,
    refreshData: refreshStockPositions,
    updateQuote,
  } = useStockPositions();
  const {loading: loadingRelatedStocks, relatedStocks} = useFetchRelatedStocks(params.isin || '', 6);
  const [stockPositionDrawer, dispatchStockPositionDrawer] = React.useReducer(
    useEntityDrawer<TStockPositionDrawerValues>,
    UseEntityDrawerDefaultState<TStockPositionDrawerValues>(),
  );
  const [showDeletePositionDialog, setShowDeletePositionDialog] = React.useState(false);
  const [deletePosition, setDeletePosition] = React.useState<TStockPositionWithQuote | null>(null);
  const barChartProps: Partial<TBarChartProps> = {
    yAxis: [
      {
        valueFormatter: value => Formatter.shortenNumber(value ?? 0),
      },
    ],
    height: 300,
    margin: {left: 80, right: 20, top: 20, bottom: 20},
    grid: {horizontal: true},
  };
  const barChartSeriesFormatter = (value: number | null) => Formatter.shortenNumber(value ?? 0);

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
    if (!params.isin || !sessionUser || loadingStockPositions || loadingQuotes || loadingDetails) return;
    socket.connect();

    socket.emit('stock:subscribe', [{isin: params.isin, exchange: 'langschwarz'}], sessionUser.id);

    socket.on(
      `stock:update:${sessionUser.id}`,
      (data: {exchange: string; isin: string; quote: {datetime: string; currency: string; price: number}}) => {
        console.log('stock:update', data);
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

    return () => {
      socket.emit('stock:unsubscribe', [{isin: params.isin, exchange: 'langschwarz'}], sessionUser.id);
      socket.disconnect();
    };
  }, [params, sessionUser]);

  React.useEffect(() => {
    refreshQuotes();
  }, [timeframe]);

  React.useEffect(() => {
    if (!params.isin || params.isin.length !== 12) return;
    refreshQuotes();
    refreshStockDetails();
    refreshStockPositions();
  }, [params.isin]);

  if (!params.isin || params.isin.length !== 12) return <Navigate to={'/stocks'} />;
  return (
    <StockLayout
      onSelectAsset={({identifier}) => navigate(`/stocks/${identifier}`)}
      onOpenPosition={({name, logo, identifier, type}) => {
        handler.showCreateDialog({stock: {type, isin: identifier, label: name, logo}});
      }}>
      <ContentGrid title={stockDetails?.asset.name ?? ''} description={params.isin} withNavigateBack>
        <Grid container size={{xs: 12, lg: 8}} spacing={AppConfig.baseSpacing}>
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

          {stockDetails && stockDetails.details.securityDetails && (
            <Grid size={{xs: 12}}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                  <Typography variant="subtitle1" fontWeight={'bold'}>
                    Profit & loss statements
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{px: 0}}>
                  <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                    <Tabs
                      value={tabPane.profit}
                      onChange={(_, value) => setTabPane(prev => ({...prev, profit: value}))}
                      sx={{mx: 2}}>
                      <Tab label="Yearly" value={0} />
                      <Tab label="Quarterly" value={1} />
                    </Tabs>
                  </Box>
                  <TabPanel idx={0} value={tabPane.profit}>
                    <BarChart
                      {...barChartProps}
                      xAxis={[
                        {
                          scaleType: 'band',
                          data: stockDetails?.details.securityDetails?.annualFinancials
                            .map(({date}) => date.getFullYear())
                            .reverse(),
                          valueFormatter: value => value.toString(),
                        },
                      ]}
                      series={[
                        {
                          label: `Revenue (${stockDetails.details.securityDetails.currency})`,
                          data: stockDetails.details.securityDetails.annualFinancials
                            .map(({revenue}) => revenue)
                            .reverse(),
                          valueFormatter: barChartSeriesFormatter,
                        },
                        {
                          label: `Net Profit (${stockDetails.details.securityDetails.currency})`,
                          data: stockDetails.details.securityDetails.annualFinancials
                            .map(({netIncome}) => netIncome)
                            .reverse(),
                          valueFormatter: barChartSeriesFormatter,
                        },
                      ]}
                    />
                  </TabPanel>
                  <TabPanel idx={1} value={tabPane.profit}>
                    <BarChart
                      {...barChartProps}
                      xAxis={[
                        {
                          scaleType: 'band',
                          data: stockDetails?.details.securityDetails?.quarterlyFinancials
                            .map(({date}) => `${Formatter.formatDate().shortMonthName(date)} ${date.getFullYear()}`)
                            .reverse(),
                        },
                      ]}
                      series={[
                        {
                          label: `Revenue (${stockDetails.details.securityDetails.currency})`,
                          data: stockDetails.details.securityDetails.quarterlyFinancials
                            .map(({revenue}) => revenue)
                            .reverse(),
                          valueFormatter: barChartSeriesFormatter,
                        },
                        {
                          label: `Net Profit (${stockDetails.details.securityDetails.currency})`,
                          data: stockDetails.details.securityDetails.quarterlyFinancials
                            .map(({netIncome}) => netIncome)
                            .reverse(),
                          valueFormatter: barChartSeriesFormatter,
                        },
                      ]}
                    />
                  </TabPanel>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                  <Typography variant="subtitle1" fontWeight={'bold'}>
                    Financial Statements
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{px: 0}}>
                  <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                    <Tabs
                      value={tabPane.financial}
                      onChange={(_, value) => setTabPane(prev => ({...prev, financial: value}))}
                      sx={{mx: 2}}>
                      <Tab label="Yearly" value={0} />
                      <Tab label="Quarterly" value={1} />
                    </Tabs>
                  </Box>
                  <TabPanel idx={0} value={tabPane.financial}>
                    <BarChart
                      {...barChartProps}
                      xAxis={[
                        {
                          scaleType: 'band',
                          data: stockDetails?.details.securityDetails?.annualFinancials
                            .map(({date}) => date.getFullYear())
                            .reverse(),
                          valueFormatter: value => value.toString(),
                        },
                      ]}
                      series={[
                        {
                          label: `Revenue (${stockDetails.details.securityDetails.currency})`,
                          data: stockDetails.details.securityDetails.annualFinancials
                            .map(({revenue}) => revenue)
                            .reverse(),
                          valueFormatter: barChartSeriesFormatter,
                        },
                        {
                          label: `Gross Profit (${stockDetails.details.securityDetails.currency})`,
                          data: stockDetails.details.securityDetails.annualFinancials
                            .map(({grossProfit}) => grossProfit)
                            .reverse(),
                          valueFormatter: barChartSeriesFormatter,
                        },
                        {
                          label: `EBITDA (${stockDetails.details.securityDetails.currency})`,
                          data: stockDetails.details.securityDetails.annualFinancials
                            .map(({ebitda}) => ebitda)
                            .reverse(),
                          valueFormatter: barChartSeriesFormatter,
                        },
                        {
                          label: `Net Profit (${stockDetails.details.securityDetails.currency})`,
                          data: stockDetails.details.securityDetails.annualFinancials
                            .map(({netIncome}) => netIncome)
                            .reverse(),
                          valueFormatter: barChartSeriesFormatter,
                        },
                      ]}
                    />
                  </TabPanel>
                  <TabPanel idx={1} value={tabPane.financial}>
                    <BarChart
                      {...barChartProps}
                      xAxis={[
                        {
                          scaleType: 'band',
                          data: stockDetails?.details.securityDetails?.quarterlyFinancials
                            .map(({date}) => `${Formatter.formatDate().shortMonthName(date)} ${date.getFullYear()}`)
                            .reverse(),
                        },
                      ]}
                      series={[
                        {
                          label: `Revenue (${stockDetails.details.securityDetails.currency})`,
                          data: stockDetails.details.securityDetails.quarterlyFinancials
                            .map(({revenue}) => revenue)
                            .reverse(),
                          valueFormatter: barChartSeriesFormatter,
                        },
                        {
                          label: `Gross Profit (${stockDetails.details.securityDetails.currency})`,
                          data: stockDetails.details.securityDetails.quarterlyFinancials
                            .map(({grossProfit}) => grossProfit)
                            .reverse(),
                          valueFormatter: barChartSeriesFormatter,
                        },
                        {
                          label: `EBITDA (${stockDetails.details.securityDetails.currency})`,
                          data: stockDetails.details.securityDetails.quarterlyFinancials
                            .map(({ebitda}) => ebitda)
                            .reverse(),
                          valueFormatter: barChartSeriesFormatter,
                        },
                        {
                          label: `Net Profit (${stockDetails.details.securityDetails.currency})`,
                          data: stockDetails.details.securityDetails.quarterlyFinancials
                            .map(({netIncome}) => netIncome)
                            .reverse(),
                          valueFormatter: barChartSeriesFormatter,
                        },
                      ]}
                    />
                  </TabPanel>
                </AccordionDetails>
              </Accordion>
            </Grid>
          )}

          <Grid container size={{xs: 12}} spacing={AppConfig.baseSpacing}>
            {loadingRelatedStocks
              ? Array.from({length: 6}).map((_, idx) => (
                  <Grid key={idx} size={{xs: 6, md: 4}}>
                    <RelatedStock isLoading />
                  </Grid>
                ))
              : relatedStocks.map((stock, idx) => (
                  <Grid key={idx} size={{xs: 12, md: 4}}>
                    <RelatedStock key={stock.asset._id.identifier} stock={stock} />
                  </Grid>
                ))}
          </Grid>
        </Grid>

        <Grid container size={{xs: 12, lg: 4}} spacing={AppConfig.baseSpacing}>
          <Grid size={{xs: 12}}>
            {loadingDetails ? (
              <CircularProgress />
            ) : stockDetails ? (
              <CompanyInformation details={stockDetails} />
            ) : (
              <NoStockMessage />
            )}
          </Grid>

          <Grid size={{xs: 12}}>
            {loadingDetails ? (
              <CircularProgress />
            ) : stockDetails ? (
              <DividendList dividends={stockDetails.details.futureDividends ?? []} />
            ) : (
              <NoStockMessage />
            )}
          </Grid>

          {stockDetails && (
            <Grid size={{xs: 12}}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                  <Typography variant="subtitle1" fontWeight={'bold'}>
                    Company Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">
                    {stockDetails.details.securityDetails?.description ?? 'No description available'}
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {stockDetails.asset.security.type === 'ETF' && stockDetails.details.etfBreakdown && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                    <Tooltip
                      title={`As of ${format(stockDetails.details.etfBreakdown.updatedAt, 'dd.MM.yyyy')}`}
                      placement="right">
                      <Typography variant="subtitle1" fontWeight={'bold'}>
                        ETF Breakdown
                      </Typography>
                    </Tooltip>
                  </AccordionSummary>
                  <AccordionDetails>
                    <PieChart
                      fullWidth
                      series={[
                        {
                          data: stockDetails.details.etfBreakdown.holdings.map(({marketValue, name}) => ({
                            label: name,
                            value: marketValue,
                          })),
                          valueFormatter: value => Formatter.formatBalance(value.value),
                        },
                      ]}
                    />
                  </AccordionDetails>
                </Accordion>
              )}

              {stockDetails.asset.security.type === 'ETF' && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                    <Typography variant="subtitle1" fontWeight={'bold'}>
                      Region Breakdown
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <PieChart
                      fullWidth
                      series={[
                        {
                          data: stockDetails.asset.security.regions.map(({id, share}) => ({label: id, value: share})),
                          valueFormatter: value => `${value.value} shares`,
                        },
                      ]}
                    />
                  </AccordionDetails>
                </Accordion>
              )}

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                  <Typography variant="subtitle1" fontWeight={'bold'}>
                    Symbols
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{p: 0}}>
                  {loadingDetails ? (
                    <CircularProgress />
                  ) : stockDetails.asset.security.symbols.length > 0 ? (
                    <List sx={{py: 0}}>
                      {stockDetails.asset.security.symbols.map(({symbol, exchange}, idx, arr) => (
                        <React.Fragment key={symbol}>
                          <ListItem
                            alignItems="flex-start"
                            secondaryAction={<Typography variant="body2">{symbol}</Typography>}
                            dense>
                            <ListItemText primary={exchange} />
                          </ListItem>
                          {idx + 1 !== arr.length && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <NoResults text="No symbols found for this asset" sx={{m: 2, mt: 0}} />
                  )}
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                  <Typography variant="subtitle1" fontWeight={'bold'}>
                    Ratings
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{p: 0}}>
                  <StockRating ratings={stockDetails.details.scorings} />
                </AccordionDetails>
              </Accordion>
            </Grid>
          )}

          <Grid size={{xs: 12}}>
            {loadingDetails ? (
              <CircularProgress />
            ) : stockDetails ? (
              <StockNews
                news={stockDetails.details.news.map(({title, description, url}) => ({
                  heading: title,
                  summary: description,
                  link: url,
                }))}
              />
            ) : (
              <NoStockMessage />
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
      </ContentGrid>
    </StockLayout>
  );
};

export default withFeatureFlag(Feature.STOCKS, withAuthLayout(Stock), true);
