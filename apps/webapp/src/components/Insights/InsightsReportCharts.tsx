import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import {ComposedChart} from '@budgetbuddyde/charts';
import {Grid, Stack} from '@mui/material';
import {useTranslations} from 'next-intl';
import React from 'react';
import {Card} from '@/components/Card';
import {Formatter} from '@/utils/Formatter';
import {useCurrencyPreference} from '@/utils/Formatter/PreferenceContext';

export type InsightsReportChartsProps = {
  report: TInsightsReport;
};

export const InsightsReportCharts: React.FC<InsightsReportChartsProps> = ({report}) => {
  const t = useTranslations('InsightsCharts');
  const currency = useCurrencyPreference();
  const formatBalance = (value: number | null) => Formatter.currency.formatBalance(value ?? 0, currency);
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
              <Card.Title>{t('incomeExpensesBalance')}</Card.Title>
              <Card.Subtitle>{t('granularity', {granularity: report.granularity})}</Card.Subtitle>
            </Stack>
          </Card.Header>
          <Card.Body>
            <ComposedChart
              height={320}
              data={timelineData}
              xKey="label"
              axisValueFormatter={value => Formatter.currency.shortenBalance(value, currency)}
              tooltipValueFormatter={value => formatBalance(value)}
              showLegend
              showGrid
              leftAxisLabel={t('periodAmount')}
              rightAxisLabel={t('cumulativeBalance')}
              referenceLines={[
                ...(averageExpenses === null
                  ? []
                  : [{y: averageExpenses, label: t('averageExpenses'), role: 'expense' as const, yAxisId: 'left'}]),
                ...(averageIncome === null
                  ? []
                  : [{y: averageIncome, label: t('averageIncome'), role: 'income' as const, yAxisId: 'left'}]),
              ]}
              series={[
                {key: 'expenses', label: t('expenses'), type: 'bar', role: 'expense'},
                {key: 'income', label: t('income'), type: 'bar', role: 'income'},
                {
                  key: 'cumulativeBalance',
                  label: t('cumulativeBalance'),
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
              <Card.Title>{t('accumulatedExpenses')}</Card.Title>
              <Card.Subtitle>{t('runningTotal')}</Card.Subtitle>
            </Stack>
          </Card.Header>
          <Card.Body>
            <ComposedChart
              height={320}
              data={categoryData}
              xKey="label"
              axisValueFormatter={value => Formatter.currency.shortenBalance(value, currency)}
              tooltipValueFormatter={value => formatBalance(value)}
              showLegend
              showGrid
              referenceLines={
                averageAccumulatedExpenses === null
                  ? []
                  : [
                      {
                        y: averageAccumulatedExpenses,
                        label: t('averageTotalExpenses'),
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
