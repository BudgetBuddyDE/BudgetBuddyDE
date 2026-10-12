'use client';

import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import type {IGetInsightsReportQuery} from '@budgetbuddyde/api/interfaces';
import {BarChart, ComposedChart, LineChart, WaterfallChart} from '@budgetbuddyde/charts';
import {Box, Button, Grid, Stack, ToggleButton, ToggleButtonGroup, Typography} from '@mui/material';
import NextLink from 'next/link';
import React from 'react';
import {Card} from '@/components/Card';
import {Formatter} from '@/utils/Formatter';
import {DailyExpenseHeatmap} from './DailyExpenseHeatmap';
import {insightsTransactionHref} from './insightsAnalysisData';
import {cashflowBridge, categoryExpenseTimeline, savingsRateTimeline} from './insightsTimeSeries';

export type InsightsReportChartsProps = {
  report: TInsightsReport;
  reportQuery?: IGetInsightsReportQuery;
  refreshing?: boolean;
};

type FlowMode = 'timeline' | 'bridge' | 'savings' | 'daily';

const formatBalance = (value: number) => Formatter.currency.formatBalance(value);
const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const average = (values: number[]) =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

export const InsightsReportCharts: React.FC<InsightsReportChartsProps> = ({
  report,
  reportQuery,
  refreshing = false,
}) => {
  const [flowMode, setFlowMode] = React.useState<FlowMode>('timeline');
  const [categoryMode, setCategoryMode] = React.useState<'cumulative' | 'period'>('cumulative');
  const [dailyOpened, setDailyOpened] = React.useState(false);
  const timeline = report.timeline;
  const timelineData = React.useMemo(
    () =>
      timeline.map(row => ({
        label: row.label,
        expenses: row.expenses,
        income: row.income,
        cumulativeBalance: row.cumulativeBalance,
      })),
    [timeline],
  );
  const categoryData = React.useMemo(
    () => categoryExpenseTimeline(report, categoryMode === 'cumulative'),
    [report, categoryMode],
  );
  const categorySeries = report.categoryTimeline.map((row, index) => ({
    key: `category-${index}`,
    label: row.label,
    colorId: row.categoryId ?? 'other-categories',
  }));
  const averageIncome = average(timeline.map(row => row.income));
  const averageExpenses = average(timeline.map(row => row.expenses));
  const averageAccumulatedExpenses = average(
    timeline.map((_, rowIndex) =>
      report.categoryTimeline.reduce((sum, series) => sum + (series.values[rowIndex] ?? 0), 0),
    ),
  );
  const bridge = React.useMemo(() => cashflowBridge(report), [report]);
  const savings = React.useMemo(() => savingsRateTimeline(timeline), [timeline]);

  return (
    <Grid container spacing={2}>
      <Grid size={{xs: 12, lg: flowMode === 'daily' ? 12 : 7}}>
        <Card>
          <Card.Header>
            <Stack sx={{gap: 1, minWidth: 0}}>
              <Card.Title>
                {flowMode === 'timeline'
                  ? 'Income, expenses and balance'
                  : flowMode === 'bridge'
                    ? 'Cash flow composition'
                    : flowMode === 'savings'
                      ? 'Transaction-based savings rate'
                      : 'Daily expense patterns'}
              </Card.Title>
              <Card.Subtitle>
                {flowMode === 'timeline'
                  ? `${report.granularity} aggregation · currency flows use the left scale; cumulative balance uses the right scale`
                  : flowMode === 'bridge'
                    ? 'Recorded income minus recorded expenses in the selected period'
                    : flowMode === 'savings'
                      ? 'Recorded net cash flow as a percentage of recorded income per period'
                      : 'Recorded expenses by business date'}
              </Card.Subtitle>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={flowMode}
                aria-label="Cash flow view"
                disabled={refreshing}
                sx={{flexWrap: 'wrap'}}
                onChange={(_, mode: FlowMode | null) => {
                  if (!mode) return;
                  setFlowMode(mode);
                  if (mode === 'daily') setDailyOpened(true);
                }}
              >
                <ToggleButton value="timeline">Timeline</ToggleButton>
                <ToggleButton value="bridge">Composition</ToggleButton>
                <ToggleButton value="savings">Savings rate</ToggleButton>
                <ToggleButton value="daily">Daily patterns</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Card.Header>
          <Card.Body>
            {flowMode === 'timeline' && (
              <>
                <ComposedChart
                  height={320}
                  data={timelineData}
                  xKey="label"
                  ariaLabel="Recorded income, expenses and cumulative period cash flow"
                  axisValueFormatter={value => Formatter.currency.shortenBalance(value)}
                  tooltipValueFormatter={formatBalance}
                  showLegend
                  leftAxisLabel="Period amount"
                  rightAxisLabel="Cumulative balance"
                  referenceLines={[
                    ...(averageExpenses === null
                      ? []
                      : [{y: averageExpenses, label: 'Avg. expenses', role: 'expense' as const, yAxisId: 'left'}]),
                    ...(averageIncome === null
                      ? []
                      : [{y: averageIncome, label: 'Avg. income', role: 'income' as const, yAxisId: 'left'}]),
                  ]}
                  series={[
                    {key: 'expenses', label: 'Expenses', type: 'bar', role: 'expense'},
                    {key: 'income', label: 'Income', type: 'bar', role: 'income'},
                    {
                      key: 'cumulativeBalance',
                      label: 'Cumulative balance',
                      type: 'line',
                      role: 'balance',
                      yAxisId: 'right',
                    },
                  ]}
                />
                <Typography variant="caption" color="text.secondary">
                  Cumulative balance starts at zero for the selected period; it is not an account balance.
                </Typography>
              </>
            )}
            {flowMode === 'bridge' && (
              <>
                <WaterfallChart data={bridge} height={320} valueFormatter={formatBalance} />
                <Box component="details" sx={{mt: 1}}>
                  <summary>Amounts and category transactions</summary>
                  <Stack spacing={0.5} sx={{mt: 1}}>
                    {bridge.map((row, index) => (
                      <Typography key={`${row.label}-${index}`} variant="body2">
                        {row.label}: {formatBalance(row.value)}
                      </Typography>
                    ))}
                    {report.categories
                      .filter(row => row.expenses.value > 0)
                      .map(row => (
                        <Button
                          component={NextLink}
                          key={row.category.id}
                          href={insightsTransactionHref(report, reportQuery, {categories: [row.category.id]})}
                          size="small"
                          sx={{justifyContent: 'flex-start'}}
                        >
                          View {row.category.name} transactions
                        </Button>
                      ))}
                  </Stack>
                </Box>
              </>
            )}
            {flowMode === 'savings' && (
              <>
                <LineChart
                  data={savings}
                  xKey="label"
                  series={[{key: 'savingsRate', label: 'Savings rate', role: 'balance'}]}
                  ariaLabel="Transaction-based savings rate per period"
                  valueFormatter={formatPercent}
                  connectNulls={false}
                  showDots
                  referenceLines={[{y: 0, label: 'Zero'}]}
                  height={320}
                />
                <Typography variant="body2" color="text.secondary">
                  Periods without recorded income have no calculable rate. Negative rates are possible; transfers may
                  affect this transaction-based measure.
                </Typography>
                <Box component="details" sx={{mt: 1}}>
                  <summary>Savings rates by period</summary>
                  <Stack spacing={0.5} sx={{mt: 1}}>
                    {savings.map((row, index) => (
                      <Typography key={index} variant="body2">
                        {row.label}:{' '}
                        {typeof row.savingsRate === 'number'
                          ? formatPercent(row.savingsRate)
                          : 'N/A (no recorded income)'}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              </>
            )}
            {dailyOpened && (
              <Box hidden={flowMode !== 'daily'}>
                <DailyExpenseHeatmap
                  report={report}
                  reportQuery={reportQuery}
                  active={flowMode === 'daily'}
                  refreshing={refreshing}
                />
              </Box>
            )}
          </Card.Body>
        </Card>
      </Grid>
      <Grid size={{xs: 12, lg: flowMode === 'daily' ? 12 : 5}}>
        <Card>
          <Card.Header>
            <Stack sx={{gap: 1}}>
              <Card.Title>
                {categoryMode === 'cumulative' ? 'Accumulated expenses' : 'Category expenses per period'}
              </Card.Title>
              <Card.Subtitle>
                {categoryMode === 'cumulative'
                  ? 'Running total from the start of the period'
                  : `${report.granularity} amounts · top categories and Other`}
              </Card.Subtitle>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={categoryMode}
                aria-label="Category expense view"
                disabled={refreshing}
                onChange={(_, mode: 'cumulative' | 'period' | null) => {
                  if (mode) setCategoryMode(mode);
                }}
              >
                <ToggleButton value="cumulative">Cumulative</ToggleButton>
                <ToggleButton value="period">Per period</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Card.Header>
          <Card.Body>
            {categoryMode === 'cumulative' ? (
              <ComposedChart
                height={320}
                data={categoryData}
                xKey="label"
                ariaLabel="Cumulative recorded category expenses"
                axisValueFormatter={value => Formatter.currency.shortenBalance(value)}
                tooltipValueFormatter={formatBalance}
                showLegend
                referenceLines={
                  averageAccumulatedExpenses === null
                    ? []
                    : [{y: averageAccumulatedExpenses, label: 'Avg. total expenses', role: 'target', yAxisId: 'left'}]
                }
                series={categorySeries.map(row => ({...row, type: 'line' as const, connectNulls: false}))}
              />
            ) : (
              <BarChart
                data={categoryData}
                xKey="label"
                series={categorySeries}
                stacked
                showLegend
                height={320}
                ariaLabel="Recorded expenses by category per period"
                axisValueFormatter={value => Formatter.currency.shortenBalance(value)}
                tooltipValueFormatter={formatBalance}
              />
            )}
            <Box component="details" sx={{mt: 1}}>
              <summary>Category amounts by period</summary>
              <Stack spacing={0.75} sx={{mt: 1}}>
                {categoryData.map((row, index) => (
                  <Box key={index}>
                    <Typography variant="body2" sx={{fontWeight: 600}}>
                      {row.label}
                    </Typography>
                    {categorySeries.map(series => (
                      <Typography key={series.key} variant="body2">
                        {series.label}:{' '}
                        {typeof row[series.key] === 'number' ? formatBalance(row[series.key] as number) : 'No data'}
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Stack>
            </Box>
          </Card.Body>
        </Card>
      </Grid>
    </Grid>
  );
};
