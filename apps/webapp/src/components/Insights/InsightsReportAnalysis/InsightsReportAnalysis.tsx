'use client';

import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import {Box, FormControl, Grid, InputLabel, MenuItem, Select} from '@mui/material';
import React from 'react';
import {Card} from '@/components/Card';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {useCurrencyFormatter} from '@/hooks/useCurrencyFormatter';
import {ReportTable} from '../ReportTable/ReportTable';

type CategoryMetric = 'expenses' | 'income' | 'balance';
type PaymentMetric = 'count' | 'volume';

export type InsightsReportAnalysisProps = {
  report: TInsightsReport;
  selectedCategoryRows: TInsightsReport['categories'];
};

export const InsightsReportAnalysis: React.FC<InsightsReportAnalysisProps> = ({report, selectedCategoryRows}) => {
  const t = useAppTranslations();
  const currencyFormatter = useCurrencyFormatter();
  const [categoryMetric, setCategoryMetric] = React.useState<CategoryMetric>('expenses');
  const [paymentMetric, setPaymentMetric] = React.useState<PaymentMetric>('count');

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{xs: 12, lg: 7}}>
          <Card>
            <Card.Header>
              <Card.Title>{t('insights.categoryAnalysis')}</Card.Title>
              <FormControl size="small" sx={{minWidth: 130}}>
                <InputLabel id="insights-report-category-metric-label">{t('insights.metric')}</InputLabel>
                <Select
                  labelId="insights-report-category-metric-label"
                  id="insights-report-category-metric"
                  label={t('insights.metric')}
                  value={categoryMetric}
                  onChange={event => setCategoryMetric(event.target.value as CategoryMetric)}
                >
                  <MenuItem value="expenses">{t('insights.expenses')}</MenuItem>
                  <MenuItem value="income">{t('insights.income')}</MenuItem>
                  <MenuItem value="balance">{t('insights.balance')}</MenuItem>
                </Select>
              </FormControl>
            </Card.Header>
            <Card.Body>
              <ReportTable
                headers={[
                  t('insights.category'),
                  t('insights.selectedMetric'),
                  t('insights.expenses'),
                  t('insights.income'),
                  t('insights.balance'),
                  t('insights.share'),
                ]}
                rightAlignedColumns={[1, 2, 3, 4, 5]}
                rows={selectedCategoryRows.map(row => [
                  row.category.name,
                  currencyFormatter.formatBalance(row[categoryMetric].value),
                  currencyFormatter.formatBalance(row.expenses.value),
                  currencyFormatter.formatBalance(row.income.value),
                  currencyFormatter.formatBalance(row.balance.value),
                  row.expenseShare.toFixed(1) + '%',
                ])}
              />
            </Card.Body>
          </Card>
        </Grid>
        <Grid size={{xs: 12, lg: 5}}>
          <Card>
            <Card.Header>
              <Card.Title>{t('insights.paymentMethodUsage')}</Card.Title>
              <FormControl size="small" sx={{minWidth: 110}}>
                <InputLabel id="insights-report-payment-metric-label">{t('insights.rankBy')}</InputLabel>
                <Select
                  labelId="insights-report-payment-metric-label"
                  id="insights-report-payment-metric"
                  label={t('insights.rankBy')}
                  value={paymentMetric}
                  onChange={event => setPaymentMetric(event.target.value as PaymentMetric)}
                >
                  <MenuItem value="count">{t('insights.uses')}</MenuItem>
                  <MenuItem value="volume">{t('insights.volume')}</MenuItem>
                </Select>
              </FormControl>
            </Card.Header>
            <Card.Body>
              <ReportTable
                headers={[t('insights.method'), t('insights.uses'), t('insights.share'), t('insights.expenses')]}
                rightAlignedColumns={[1, 2, 3]}
                rows={[...report.paymentMethods]
                  .sort((a, b) =>
                    paymentMetric === 'count'
                      ? b.transactionCount.value - a.transactionCount.value
                      : b.expenses.value - a.expenses.value,
                  )
                  .map(row => [
                    row.paymentMethod.name,
                    String(row.transactionCount.value),
                    row.usageShare.toFixed(1) + '%',
                    currencyFormatter.formatBalance(row.expenses.value),
                  ])}
              />
            </Card.Body>
          </Card>
        </Grid>
      </Grid>
      {report.budgets && (
        <Card>
          <Card.Header>
            <Box>
              <Card.Title>{t('insights.currentMonthBudgetHealth')}</Card.Title>
              <Card.Subtitle>{t('insights.budgetsAreEvaluatedIndependentlyFromTheReportPeriod')}</Card.Subtitle>
            </Box>
          </Card.Header>
          <Card.Body>
            <ReportTable
              headers={[
                t('insights.budget'),
                t('insights.target'),
                t('insights.spent'),
                t('insights.remaining'),
                t('insights.usage'),
              ]}
              rightAlignedColumns={[1, 2, 3, 4]}
              rows={report.budgets.map(row => [
                row.name,
                currencyFormatter.formatBalance(row.budget),
                currencyFormatter.formatBalance(row.spent),
                currencyFormatter.formatBalance(row.remaining),
                row.utilization.toFixed(1) + '%',
              ])}
            />
          </Card.Body>
        </Card>
      )}
    </>
  );
};
