import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import {Grid, Stack} from '@mui/material';
import React from 'react';
import {Card} from '@/components/Card';
import {BarLineChart} from '@/components/Charts';
import {Formatter} from '@/utils/Formatter';

export type InsightsReportChartsProps = {
  report: TInsightsReport;
};

export const InsightsReportCharts: React.FC<InsightsReportChartsProps> = ({report}) => {
  const timeline = report.timeline;

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
            <BarLineChart
              height={320}
              xAxis={[{scaleType: 'band', data: timeline.map(row => row.label)}]}
              yAxis={[{width: 50, valueFormatter: (value: number) => Formatter.currency.shortenBalance(value)}]}
              series={[
                {
                  type: 'bar',
                  data: timeline.map(row => row.expenses),
                  label: 'Expenses',
                  color: '#c0392b',
                  valueFormatter: value => Formatter.currency.formatBalance(value ?? 0),
                },
                {
                  type: 'bar',
                  data: timeline.map(row => row.income),
                  label: 'Income',
                  color: '#27ae60',
                  valueFormatter: value => Formatter.currency.formatBalance(value ?? 0),
                },
                {
                  type: 'line',
                  data: timeline.map(row => row.cumulativeBalance),
                  label: 'Cumulative balance',
                  color: '#2980b9',
                  valueFormatter: value => Formatter.currency.formatBalance(value ?? 0),
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
            <BarLineChart
              height={320}
              xAxis={[{scaleType: 'band', data: timeline.map(row => row.label)}]}
              yAxis={[{width: 50, valueFormatter: (value: number) => Formatter.currency.shortenBalance(value)}]}
              series={report.categoryTimeline.map((row, index) => ({
                id: row.categoryId ?? 'other',
                type: 'line' as const,
                data: row.values,
                label: row.label,
                color: ['#8e44ad', '#d35400', '#16a085', '#2c3e50', '#f39c12'][index % 5],
                valueFormatter: (value: number | null) => Formatter.currency.formatBalance(value ?? 0),
              }))}
            />
          </Card.Body>
        </Card>
      </Grid>
    </Grid>
  );
};
