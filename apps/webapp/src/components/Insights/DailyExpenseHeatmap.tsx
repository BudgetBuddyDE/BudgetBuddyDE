'use client';

import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import type {IGetInsightsReportQuery} from '@budgetbuddyde/api/interfaces';
import {HeatmapChart, type HeatmapDataPoint} from '@budgetbuddyde/charts';
import {
  Alert,
  Box,
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';
import React from 'react';
import {apiClient} from '@/apiClient';
import {Formatter} from '@/utils/Formatter';
import {insightsTransactionHref} from './insightsAnalysisData';
import {dailyExpenseCalendar, dailyExpenseQuery} from './insightsTimeSeries';

type Props = {
  report: TInsightsReport;
  reportQuery?: IGetInsightsReportQuery;
  active: boolean;
  refreshing?: boolean;
};

export const DailyExpenseHeatmap: React.FC<Props> = ({report, reportQuery, active, refreshing = false}) => {
  const query = React.useMemo(() => reportQuery && dailyExpenseQuery(report, reportQuery), [report, reportQuery]);
  const queryKey = JSON.stringify(query);
  const cache = React.useRef<{key: string; source: TInsightsReport; report: TInsightsReport} | undefined>(undefined);
  const [attempt, setAttempt] = React.useState(0);
  const [selected, setSelected] = React.useState<HeatmapDataPoint | null>(null);
  const [loaded, setLoaded] = React.useState<{
    key: string;
    source: TInsightsReport;
    report?: TInsightsReport;
    error?: Error;
  }>();

  React.useEffect(() => {
    if (!active || refreshing || report.granularity === 'day' || !query) return;
    let ignored = false;
    const cached = cache.current;
    if (cached?.source === report && cached.key === queryKey) {
      setLoaded({key: queryKey, source: report, report: cached.report});
      return;
    }
    setLoaded(undefined);
    void apiClient.backend.insights.getReport(query).then(([response, error]) => {
      if (ignored) return;
      if (error || !response) {
        setLoaded({key: queryKey, source: report, error: error ?? new Error('Daily report is unavailable')});
        return;
      }
      cache.current = {key: queryKey, source: report, report: response.data};
      setLoaded({key: queryKey, source: report, report: response.data});
    });
    return () => {
      ignored = true;
    };
  }, [active, refreshing, report, query, queryKey, attempt]);

  React.useEffect(() => {
    setSelected(null);
  }, [report]);

  const current = loaded && loaded.key === queryKey && loaded.source === report ? loaded : undefined;
  const dailyReport = report.granularity === 'day' ? report : current?.report;
  const calendar = React.useMemo(() => (dailyReport ? dailyExpenseCalendar(dailyReport) : undefined), [dailyReport]);
  const selectedCell = calendar?.data.find(point => point.x === selected?.x && point.y === selected?.y);
  const dateHref = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day, 12);
    return insightsTransactionHref(report, reportQuery, {dateFrom: selectedDate, dateTo: selectedDate});
  };

  if (refreshing) return <Skeleton variant="rounded" height={300} aria-label="Refreshing daily expenses" />;
  if (!reportQuery && report.granularity !== 'day') {
    return <Alert severity="info">Select report filters to load daily expenses.</Alert>;
  }
  if (current?.error) {
    return (
      <Alert severity="error" action={<Button onClick={() => setAttempt(value => value + 1)}>Retry</Button>}>
        {current.error.message}
      </Alert>
    );
  }
  if (!calendar) return <Skeleton variant="rounded" height={300} aria-label="Loading daily expenses" />;

  return (
    <StackContent>
      <Typography variant="body2" color="text.secondary">
        {calendar.from} to {calendar.to} · {calendar.timezone} · up to 12 weeks. Zero means no recorded expenses;
        hatched cells are outside the range or have no data.
      </Typography>
      <HeatmapChart
        data={calendar.data}
        xLabels={calendar.xLabels}
        yLabels={calendar.yLabels}
        height={Math.max(200, calendar.yLabels.length * 30)}
        valueFormatter={Formatter.currency.formatBalance}
        onSelect={setSelected}
      />
      {selectedCell?.date && selectedCell.value !== null && (
        <Button component={NextLink} href={dateHref(selectedCell.date)} size="small">
          View transactions on {selectedCell.date}
        </Button>
      )}
      <Box component="details">
        <summary>Daily amounts and transactions</summary>
        <Box sx={{overflowX: 'auto'}}>
          <Table size="small" aria-label="Daily recorded expenses">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Expenses</TableCell>
                <TableCell>Transactions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calendar.data
                .filter(point => point.date)
                .map(point => (
                  <TableRow key={point.date}>
                    <TableCell>{point.date}</TableCell>
                    <TableCell align="right">
                      {point.value === null ? 'No data' : Formatter.currency.formatBalance(point.value)}
                    </TableCell>
                    <TableCell>
                      {point.value !== null && (
                        <Button component={NextLink} href={dateHref(point.date!)} size="small">
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </StackContent>
  );
};

const StackContent: React.FC<React.PropsWithChildren> = ({children}) => (
  <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>{children}</Box>
);
