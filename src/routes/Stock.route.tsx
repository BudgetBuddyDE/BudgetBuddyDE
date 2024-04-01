import React from 'react';
import {useParams} from 'react-router-dom';
import Chart from 'react-apexcharts';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Tab,
  TableCell,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  type TStockPosition,
  type TUpdatePositionPayload,
  type TOpenPositionPayload,
  type TTimeframe,
} from '@budgetbuddyde/types';
import {
  AddRounded,
  ArrowForwardRounded,
  DeleteRounded,
  ExpandMoreRounded,
  HelpOutlineRounded,
  TimelineRounded,
} from '@mui/icons-material';
import {format} from 'date-fns';
import {ActionPaper, Card, NoResults, TabPanel} from '@/components/Base';
import {ContentGrid} from '@/components/Layout';
import {withAuthLayout} from '@/components/Auth/Layout';
import {Table} from '@/components/Base/Table';
import {
  StockNews,
  StockPrice,
  StockService,
  EditStockPositionDrawer,
  AddStockPositionDrawer,
  CompanyInformation,
  DividendList,
  StockRating,
  PriceChart,
  useFetchStockPositions,
  useStockStore,
  useFetchStockQuotes,
  useFetchStockDetails,
  type TPriceChartPoint,
} from '@/components/Stocks';
import {formatBalance, getSocketIOClient} from '@/utils';
import {SearchInput} from '@/components/Base/Search';
import {useAuthContext} from '@/components/Auth';
import {CreateEntityDrawerState, useEntityDrawer} from '@/hooks/useEntityDrawer.reducer';
import {useSnackbarContext} from '@/components/Snackbar';
import {DeleteDialog} from '@/components/DeleteDialog.component';
import {CircularProgress} from '@/components/Loading';

const NoStockMessage = () => (
  <Card>
    <NoResults icon={<HelpOutlineRounded />} text="No information found!" />
  </Card>
);

interface IStockHandler {
  onSearch: (term: string) => void;
  onAddPosition: () => void;
  onEditPosition: (position: TStockPosition) => void;
  onCancelDeletePosition: () => void;
  onConfirmDeletePosition: () => void;
}

export const Stock = () => {
  const theme = useTheme();
  const params = useParams<{isin: string}>();
  const {showSnackbar} = useSnackbarContext();
  const {authOptions} = useAuthContext();
  const {updateQuote} = useStockStore();
  const socket = getSocketIOClient(authOptions);
  const [keyword, setKeyword] = React.useState('');
  const [chartTimeframe, setChartTimeframe] = React.useState<TTimeframe>('1m');
  const [tabPane, setTabPane] = React.useState({
    profit: 0,
    financial: 0,
  });
  const {loading: loadingDetails, details: stockDetails} = useFetchStockDetails(params.isin || '');
  const {
    loading: loadingQuotes,
    quotes,
    updateQuotes,
    refresh: refreshQuotes,
  } = useFetchStockQuotes([params.isin || ''], 'langschwarz', chartTimeframe);
  const {
    loading: loadingStockPositions,
    positions: stockPositions,
    refresh: refreshStockPositions,
  } = useFetchStockPositions();
  const [showAddDrawer, dispatchAddDrawer] = React.useReducer(
    useEntityDrawer<TOpenPositionPayload>,
    CreateEntityDrawerState<TOpenPositionPayload>(),
  );
  const [showEditDrawer, dispatchEditDrawer] = React.useReducer(
    useEntityDrawer<TUpdatePositionPayload>,
    CreateEntityDrawerState<TUpdatePositionPayload>(),
  );
  const [showDeletePositionDialog, setShowDeletePositionDialog] = React.useState(false);
  const [deletePosition, setDeletePosition] = React.useState<TStockPosition | null>(null);
  const chartOptions: Chart['props']['options'] = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false,
      },
    },
    xaxis: {
      labels: {
        style: {
          colors: theme.palette.text.primary,
        },
      },
      categories: stockDetails?.details.securityDetails?.annualFinancials.map(({date}) => date.getFullYear()).reverse(),
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      borderColor: theme.palette.action.disabled,
      strokeDashArray: 5,
    },
    yaxis: {
      forceNiceScale: true,
      opposite: true,
      labels: {
        style: {
          colors: theme.palette.text.primary,
        },
        formatter(val: number) {
          let formattedVal: number | string = val as number;
          if (formattedVal >= 1000000000) {
            formattedVal = (formattedVal / 1000000000).toFixed(2) + ' Mrd.';
          } else if (formattedVal >= 1000000) {
            formattedVal = (formattedVal / 1000000).toFixed(2) + ' Mio.';
          }
          return formattedVal as string;
        },
      },
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'left',
      labels: {
        colors: 'white',
      },
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter(val: number) {
          return formatBalance(val as number);
        },
      },
    },
  };

  const preparedChartData: TPriceChartPoint[] = React.useMemo(() => {
    if (!quotes) return [];
    return quotes[0].quotes.map(({date, price}) => ({price, date}));
  }, [quotes]);

  const displayedStockPositions = React.useMemo(() => {
    if (keyword === '') return stockPositions.filter(({isin}) => isin === params.isin);
    const lowerKeyword = keyword.toLowerCase();
    return stockPositions.filter(
      position =>
        (position.name.toLowerCase().includes(lowerKeyword) || position.isin.toLowerCase().includes(lowerKeyword)) &&
        position.isin === params.isin,
    );
  }, [keyword, stockPositions, params]);

  const handler: IStockHandler = {
    onSearch(term: string) {
      setKeyword(term);
    },
    onCancelDeletePosition() {
      setDeletePosition(null);
      setShowDeletePositionDialog(false);
    },
    async onConfirmDeletePosition() {
      if (!deletePosition) return;
      const [position, error] = await StockService.deletePosition([{id: deletePosition.id}], authOptions);
      if (error) {
        showSnackbar({
          message: error.message,
          action: <Button onClick={() => handler.onConfirmDeletePosition()}>Retry</Button>,
        });
        console.error(error);
        return;
      }
      if (!position || position.length === 0) {
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
    onAddPosition() {
      dispatchAddDrawer({type: 'open'});
    },
    onEditPosition({bought_at, buy_in, exchange, id, isin, quantity}) {
      dispatchEditDrawer({
        type: 'open',
        payload: {
          bought_at: bought_at,
          buy_in: buy_in,
          exchange: exchange.symbol,
          id: id,
          isin: isin,
          quantity: quantity,
        },
      });
    },
  };

  React.useLayoutEffect(() => {
    if (!params.isin) return;
    socket.connect();

    socket.emit('stock:subscribe', [{isin: params.isin, exchange: 'langschwarz'}], authOptions.uuid);

    socket.on(
      `stock:update:${authOptions.uuid}`,
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
      socket.emit('stock:unsubscribe', [{isin: params.isin, exchange: 'langschwarz'}], authOptions.uuid);
      socket.disconnect();
    };
  }, [params, authOptions]);

  React.useEffect(() => {
    refreshQuotes();
  }, [chartTimeframe, refreshQuotes]);

  return (
    <ContentGrid title={stockDetails?.asset.name ?? ''} description={params.isin}>
      <Grid container item xs={12} md={12} lg={8} spacing={3}>
        <Grid item xs={12} md={12}>
          {loadingQuotes ? (
            <CircularProgress />
          ) : quotes ? (
            <PriceChart data={preparedChartData} timeframe={chartTimeframe} onTimeframeChange={setChartTimeframe} />
          ) : (
            <NoResults icon={<TimelineRounded />} text="No quotes found" />
          )}
        </Grid>

        <Grid item xs={12} md={12}>
          <Table<TStockPosition>
            isLoading={loadingStockPositions}
            title="Positions"
            data={displayedStockPositions}
            headerCells={['Bought at', 'Exchange', 'Buy in', 'Price', 'Quantity', 'Value', 'Profit', '']}
            renderRow={position => (
              <TableRow key={position.id}>
                <TableCell>{format(position.bought_at, 'dd.MM.yy')}</TableCell>
                <TableCell>
                  <Chip variant="outlined" size="small" sx={{mr: 1}} label={position.exchange.symbol} />
                </TableCell>
                <TableCell>
                  <Typography>{formatBalance(position.buy_in, position.currency)}</Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={'As of ' + format(position.quote.datetime, 'dd.MM HH:mm:ss')}>
                    <StockPrice price={position.quote.price} currency={position.currency} />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography>{position.quantity} x</Typography>
                </TableCell>
                <TableCell>
                  <StockPrice price={position.quantity * position.quote.price} currency={position.currency} />
                </TableCell>
                <TableCell>
                  <StockPrice
                    price={(position.quote.price - position.buy_in) * position.quantity}
                    currency={position.currency}
                  />
                </TableCell>
                <TableCell>
                  <ActionPaper sx={{display: 'flex', width: 'fit-content', ml: 'auto'}}>
                    <IconButton
                      color="primary"
                      onClick={() => {
                        setShowDeletePositionDialog(true);
                        setDeletePosition(position);
                      }}>
                      <DeleteRounded />
                    </IconButton>

                    <IconButton color="primary" onClick={() => handler.onEditPosition(position)}>
                      <ArrowForwardRounded />
                    </IconButton>
                  </ActionPaper>
                </TableCell>
              </TableRow>
            )}
            tableActions={
              <React.Fragment>
                <SearchInput placeholder="Search position" onSearch={handler.onSearch} />
                <IconButton color="primary" onClick={handler.onAddPosition}>
                  <AddRounded fontSize="inherit" />
                </IconButton>
              </React.Fragment>
            }
          />
        </Grid>

        {stockDetails && stockDetails.details.securityDetails && (
          <Grid item xs={12} md={12}>
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
                  <Chart
                    type="bar"
                    width={'100%'}
                    height={300}
                    options={chartOptions}
                    series={[
                      {
                        name: `Revenue (${stockDetails.details.securityDetails.currency})`,
                        data: stockDetails.details.securityDetails.annualFinancials
                          .map(({revenue}) => revenue)
                          .reverse(),
                        color: theme.palette.success.main,
                      },
                      {
                        name: `Net Profit (${stockDetails.details.securityDetails.currency})`,
                        data: stockDetails.details.securityDetails.annualFinancials
                          .map(({netIncome}) => netIncome)
                          .reverse(),
                        color: theme.palette.warning.light,
                      },
                    ]}
                  />
                </TabPanel>
                <TabPanel idx={1} value={tabPane.profit}>
                  <Chart
                    type="bar"
                    width={'100%'}
                    height={300}
                    options={chartOptions}
                    series={[
                      {
                        name: `Revenue (${stockDetails.details.securityDetails.currency})`,
                        data: stockDetails.details.securityDetails.quarterlyFinancials
                          .map(({revenue}) => revenue)
                          .reverse(),
                        color: theme.palette.success.main,
                      },
                      {
                        name: `Net Profit (${stockDetails.details.securityDetails.currency})`,
                        data: stockDetails.details.securityDetails.quarterlyFinancials
                          .map(({netIncome}) => netIncome)
                          .reverse(),
                        color: theme.palette.warning.light,
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
                  <Chart
                    type="bar"
                    width={'100%'}
                    height={300}
                    options={chartOptions}
                    series={[
                      {
                        name: `Revenue (${stockDetails.details.securityDetails.currency})`,
                        data: stockDetails.details.securityDetails.annualFinancials
                          .map(({revenue}) => revenue)
                          .reverse(),
                        color: theme.palette.success.main,
                      },
                      {
                        name: `Gross Profit (${stockDetails.details.securityDetails.currency})`,
                        data: stockDetails.details.securityDetails.annualFinancials
                          .map(({grossProfit}) => grossProfit)
                          .reverse(),
                        color: theme.palette.primary.main,
                      },
                      {
                        name: `EBITDA (${stockDetails.details.securityDetails.currency})`,
                        data: stockDetails.details.securityDetails.annualFinancials.map(({ebitda}) => ebitda).reverse(),
                        color: theme.palette.primary.light,
                      },
                      {
                        name: `Net Profit (${stockDetails.details.securityDetails.currency})`,
                        data: stockDetails.details.securityDetails.annualFinancials
                          .map(({netIncome}) => netIncome)
                          .reverse(),
                        color: theme.palette.warning.light,
                      },
                    ]}
                  />
                </TabPanel>
                <TabPanel idx={1} value={tabPane.financial}>
                  <Chart
                    type="bar"
                    width={'100%'}
                    height={300}
                    options={chartOptions}
                    series={[
                      {
                        name: `Revenue (${stockDetails.details.securityDetails.currency})`,
                        data: stockDetails.details.securityDetails.quarterlyFinancials
                          .map(({revenue}) => revenue)
                          .reverse(),
                        color: theme.palette.success.main,
                      },
                      {
                        name: `Gross Profit (${stockDetails.details.securityDetails.currency})`,
                        data: stockDetails.details.securityDetails.quarterlyFinancials
                          .map(({grossProfit}) => grossProfit)
                          .reverse(),
                        color: theme.palette.primary.main,
                      },
                      {
                        name: `EBITDA (${stockDetails.details.securityDetails.currency})`,
                        data: stockDetails.details.securityDetails.quarterlyFinancials
                          .map(({ebitda}) => ebitda)
                          .reverse(),
                        color: theme.palette.primary.light,
                      },
                      {
                        name: `Net Profit (${stockDetails.details.securityDetails.currency})`,
                        data: stockDetails.details.securityDetails.quarterlyFinancials
                          .map(({netIncome}) => netIncome)
                          .reverse(),
                        color: theme.palette.warning.light,
                      },
                    ]}
                  />
                </TabPanel>
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}
      </Grid>

      <Grid container item xs={12} md={12} lg={4} spacing={3}>
        <Grid item xs={12} md={12}>
          {loadingDetails ? (
            <CircularProgress />
          ) : stockDetails ? (
            <CompanyInformation details={stockDetails} />
          ) : (
            <NoStockMessage />
          )}
        </Grid>

        <Grid item xs={12} md={12}>
          {loadingDetails ? (
            <CircularProgress />
          ) : stockDetails ? (
            <DividendList dividends={stockDetails.details.futureDividends ?? []} />
          ) : (
            <NoStockMessage />
          )}
        </Grid>

        {stockDetails && (
          <Grid item xs={12} md={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography variant="subtitle1" fontWeight={'bold'}>
                  Company Information
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  {stockDetails?.details.securityDetails?.description ?? 'No description available'}
                </Typography>
              </AccordionDetails>
            </Accordion>

            {stockDetails && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                  <Typography variant="subtitle1" fontWeight={'bold'}>
                    Ratings
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <StockRating ratings={stockDetails.details.scorings} />
                </AccordionDetails>
              </Accordion>
            )}
          </Grid>
        )}

        <Grid item xs={12} md={12}>
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

      <AddStockPositionDrawer {...showAddDrawer} onClose={() => dispatchAddDrawer({type: 'close'})} />

      <EditStockPositionDrawer {...showEditDrawer} onClose={() => dispatchEditDrawer({type: 'close'})} />

      <DeleteDialog
        open={showDeletePositionDialog}
        onClose={handler.onCancelDeletePosition}
        onCancel={handler.onCancelDeletePosition}
        onConfirm={handler.onConfirmDeletePosition}
        withTransition
      />
    </ContentGrid>
  );
};

export default withAuthLayout(Stock);
