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

  const categoryData = React.useMemo(() => {
    const rows = timeline.map(row => ({label: row.label}) as Record<string, string | number | null>);
    report.categoryTimeline.forEach((series, seriesIndex) => {
      series.values.forEach((value, rowIndex) => {
        rows[rowIndex][`category-${seriesIndex}`] = value;
      });
    });
    return rows;
  }, [report.categoryTimeline, timeline]);

  return (
    <Grid container spacing={2}>
      <Grid size={{xs: 12, lg: 7}}>
        <Card>
          <Card.Header>
            <Stack>
              <Card.Title>Income, expenses and balance</Card.Title>
              <Card.Subtitle>{report.granularity} aggregation</Card.Subtitle>
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
              series={[
                {key: 'expenses', label: 'Expenses', type: 'bar', role: 'expense'},
                {key: 'income', label: 'Income', type: 'bar', role: 'income'},
                {key: 'cumulativeBalance', label: 'Cumulative balance', type: 'line', role: 'balance'},
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
              series={report.categoryTimeline.map((row, index) => ({
                key: `category-${index}`,
                label: row.label,
                type: 'line' as const,
                colorId: row.categoryId ?? `category-${index}`,
              }))}
            />
          </Card.Body>
        </Card>
      </Grid>
    </Grid>
  );
};
