import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import {ComposedChart} from '@budgetbuddyde/charts';
import {Grid, Stack} from '@mui/material';
import React from 'react';
import {Card} from '@/components/Card';
import {Formatter} from '@/utils/Formatter';

export type InsightsReportChartsProps = {
  report: TInsightsReport;
};

const formatBalance = (value: number | null) => Formatter.currency.formatBalance(value ?? 0);

export const InsightsReportCharts: React.FC<InsightsReportChartsProps> = ({report}) => {
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

  const {categoryData, averageIncome, averageExpenses, averageAccumulatedExpenses} = React.useMemo(() => {
    const rows = timeline.map((row, rowIndex) => {
      const categoryRow: Record<string, string | number | null> = {label: row.label};
      report.categoryTimeline.forEach((series, seriesIndex) => {
        categoryRow[`category-${seriesIndex}`] = series.values[rowIndex] ?? null;
      });
      return categoryRow;
    });
    const average = (values: number[]) =>
      values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    const periodTotals = timeline.map((_, rowIndex) =>
      report.categoryTimeline.reduce((sum, series) => sum + (series.values[rowIndex] ?? 0), 0),
    );
    return {
      categoryData: rows,
      averageIncome: average(timeline.map(row => row.income)),
      averageExpenses: average(timeline.map(row => row.expenses)),
      averageAccumulatedExpenses: average(periodTotals),
    };
  }, [report.categoryTimeline, timeline]);

  return (
    <Grid container spacing={2}>
      <Grid size={{xs: 12, lg: 7}}>
        <Card>
          <Card.Header>
            <Stack>
              <Card.Title>Income, expenses and balance</Card.Title>
              <Card.Subtitle>
                {report.granularity} aggregation · currency flows use the left scale; cumulative balance uses the right
                scale
              </Card.Subtitle>
            </Stack>
          </Card.Header>
          <Card.Body>
            <ComposedChart
              height={320}
              data={timelineData}
              xKey="label"
              axisValueFormatter={value => Formatter.currency.shortenBalance(value)}
              tooltipValueFormatter={value => formatBalance(value)}
              showLegend
              showGrid
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
          </Card.Body>
        </Card>
      </Grid>
      <Grid size={{xs: 12, lg: 5}}>
        <Card>
          <Card.Header>
            <Stack>
              <Card.Title>Accumulated expenses</Card.Title>
              <Card.Subtitle>Running total from the start of the period</Card.Subtitle>
            </Stack>
          </Card.Header>
          <Card.Body>
            <ComposedChart
              height={320}
              data={categoryData}
              xKey="label"
              axisValueFormatter={value => Formatter.currency.shortenBalance(value)}
              tooltipValueFormatter={value => formatBalance(value)}
              showLegend
              showGrid
              referenceLines={
                averageAccumulatedExpenses === null
                  ? []
                  : [
                      {
                        y: averageAccumulatedExpenses,
                        label: 'Avg. total expenses',
                        role: 'target',
                        yAxisId: 'left',
                      },
                    ]
              }
              series={report.categoryTimeline.map((row, index) => ({
                key: `category-${index}`,
                label: row.label,
                type: 'line' as const,
                colorId: row.categoryId ?? `category-${index}`,
                connectNulls: false,
              }))}
            />
          </Card.Body>
        </Card>
      </Grid>
    </Grid>
  );
};
