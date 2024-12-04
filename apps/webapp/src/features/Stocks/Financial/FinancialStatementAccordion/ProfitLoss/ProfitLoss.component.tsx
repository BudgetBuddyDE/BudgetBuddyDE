import {ExpandMoreRounded} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import React from 'react';

import {BarChart, type TBarChartProps} from '@/components/Base/Charts';
import {StockService} from '@/features/Stocks/StockService';
import {Formatter} from '@/services/Formatter';

import {EFinancialStatementTimeframe} from '../FinancialStatementAccordion.component';

export type TProfitLossProps = {
  barChartProps?: Partial<TBarChartProps>;
  stockDetails: Awaited<ReturnType<typeof StockService.getAssetDetails>>[0];
  seriesFormatter: (value: number | null) => string;
};

export const ProfitLoss: React.FC<TProfitLossProps> = ({barChartProps, stockDetails, seriesFormatter}) => {
  const [timeframe, setTimeframe] = React.useState(EFinancialStatementTimeframe.Yearly);

  const dateFormatter = React.useCallback(
    (date: Date): string => {
      return timeframe === EFinancialStatementTimeframe.Yearly
        ? date.getFullYear().toString()
        : `${Formatter.formatDate().shortMonthName(date)} ${date.getFullYear()}`;
    },
    [timeframe],
  );
  const currency = React.useMemo(() => stockDetails?.details.securityDetails?.currency, [stockDetails]);
  const chartData = React.useMemo(() => {
    return (
      stockDetails?.details.securityDetails?.[
        timeframe === EFinancialStatementTimeframe.Yearly ? 'annualFinancials' : 'quarterlyFinancials'
      ] || []
    );
  }, [stockDetails, timeframe]);
  const tableData: {label: string; prevValue: number; latestValue: number}[] = React.useMemo(() => {
    if (chartData.length < 2) return [];
    const data = chartData.slice(0, 2);
    return [
      {label: 'Revenue', prevValue: data[1].revenue, latestValue: data[0].revenue},
      {label: 'Net Profit', prevValue: data[1].netIncome, latestValue: data[0].netIncome},
    ];
  }, [chartData, timeframe, dateFormatter]);
  const tableLabels: string[] = React.useMemo(() => {
    if (chartData.length < 2) return [];
    const data = chartData.slice(0, 2);
    return data.map(({date}) => dateFormatter(new Date(date)));
  }, [tableData, timeframe]);

  if (chartData.length === 0) return null;
  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
        <Typography variant="subtitle1" fontWeight={'bold'}>
          Profit & loss statements
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{px: 0}}>
        <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
          <Tabs value={timeframe} onChange={(_, value) => setTimeframe(value)} sx={{mx: 2}}>
            <Tab label="Yearly" value={EFinancialStatementTimeframe.Yearly} />
            <Tab label="Quarterly" value={EFinancialStatementTimeframe.Quarterly} />
          </Tabs>
        </Box>
        <Box>
          <BarChart
            {...barChartProps}
            xAxis={[
              {
                scaleType: 'band',
                data: chartData.map(({date}) => dateFormatter(date)).reverse(),
                valueFormatter: value => value.toString(),
              },
            ]}
            series={[
              {
                label: `Revenue (${currency})`,
                data: chartData.map(({revenue}) => revenue).reverse(),
                valueFormatter: seriesFormatter,
              },
              {
                label: `Net Profit (${currency})`,
                data: chartData.map(({netIncome}) => netIncome).reverse(),
                valueFormatter: seriesFormatter,
              },
            ]}
          />
        </Box>
        <Box>
          <Divider sx={{mt: 2}} />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>({currency})</TableCell>
                  {tableLabels.reverse().map(label => (
                    <TableCell align="right" key={label}>
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map(row => (
                  <TableRow
                    key={row.label.toLowerCase().replaceAll(/ /g, '_')}
                    sx={{'&:last-child td, &:last-child th': {border: 0}}}>
                    <TableCell component="th" scope="row">
                      {row.label}
                    </TableCell>
                    <TableCell align="right">{Formatter.shortenNumber(row.prevValue)}</TableCell>
                    <TableCell align="right">{Formatter.shortenNumber(row.latestValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
