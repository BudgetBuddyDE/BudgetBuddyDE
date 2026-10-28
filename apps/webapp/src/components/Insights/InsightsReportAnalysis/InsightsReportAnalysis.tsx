import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import {Box, FormControl, Grid, InputLabel, MenuItem, Select} from '@mui/material';
import {useTranslations} from 'next-intl';
import React from 'react';
import {Card} from '@/components/Card';
import {Formatter} from '@/utils/Formatter';
import {useCurrencyPreference} from '@/utils/Formatter/PreferenceContext';
import {ReportTable} from '../ReportTable/ReportTable';

type CategoryMetric = 'expenses' | 'income' | 'balance';
type PaymentMetric = 'count' | 'volume';

export type InsightsReportAnalysisProps = {
  report: TInsightsReport;
  selectedCategoryRows: TInsightsReport['categories'];
};

export const InsightsReportAnalysis: React.FC<InsightsReportAnalysisProps> = ({report, selectedCategoryRows}) => {
  const t = useTranslations('InsightsAnalysis');
  const currency = useCurrencyPreference();
  const [categoryMetric, setCategoryMetric] = React.useState<CategoryMetric>('expenses');
  const [paymentMetric, setPaymentMetric] = React.useState<PaymentMetric>('count');

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{xs: 12, lg: 7}}>
          <Card>
            <Card.Header>
              <Card.Title>{t('categoryAnalysis')}</Card.Title>
              <FormControl size="small" sx={{minWidth: 130}}>
                <InputLabel id="insights-report-category-metric-label">{t('metric')}</InputLabel>
                <Select
                  labelId="insights-report-category-metric-label"
                  id="insights-report-category-metric"
                  label={t('metric')}
                  value={categoryMetric}
                  onChange={event => setCategoryMetric(event.target.value as CategoryMetric)}
                >
                  <MenuItem value="expenses">{t('expenses')}</MenuItem>
                  <MenuItem value="income">{t('income')}</MenuItem>
                  <MenuItem value="balance">{t('balance')}</MenuItem>
                </Select>
              </FormControl>
            </Card.Header>
            <Card.Body>
              <ReportTable
                headers={[t('category'), t('selectedMetric'), t('expenses'), t('income'), t('balance'), t('share')]}
                rightAlignedColumns={[1, 2, 3, 4, 5]}
                rows={selectedCategoryRows.map(row => [
                  row.category.name,
                  Formatter.currency.formatBalance(row[categoryMetric].value, currency),
                  Formatter.currency.formatBalance(row.expenses.value, currency),
                  Formatter.currency.formatBalance(row.income.value, currency),
                  Formatter.currency.formatBalance(row.balance.value, currency),
                  row.expenseShare.toFixed(1) + '%',
                ])}
              />
            </Card.Body>
          </Card>
        </Grid>
        <Grid size={{xs: 12, lg: 5}}>
          <Card>
            <Card.Header>
              <Card.Title>{t('paymentMethodUsage')}</Card.Title>
              <FormControl size="small" sx={{minWidth: 110}}>
                <InputLabel id="insights-report-payment-metric-label">{t('rankBy')}</InputLabel>
                <Select
                  labelId="insights-report-payment-metric-label"
                  id="insights-report-payment-metric"
                  label={t('rankBy')}
                  value={paymentMetric}
                  onChange={event => setPaymentMetric(event.target.value as PaymentMetric)}
                >
                  <MenuItem value="count">{t('uses')}</MenuItem>
                  <MenuItem value="volume">{t('volume')}</MenuItem>
                </Select>
              </FormControl>
            </Card.Header>
            <Card.Body>
              <ReportTable
                headers={[t('method'), t('uses'), t('share'), t('expenses')]}
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
                    Formatter.currency.formatBalance(row.expenses.value, currency),
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
              <Card.Title>{t('currentMonthBudgetHealth')}</Card.Title>
              <Card.Subtitle>{t('budgetIndependentPeriod')}</Card.Subtitle>
            </Box>
          </Card.Header>
          <Card.Body>
            <ReportTable
              headers={[t('budget'), t('target'), t('spent'), t('remaining'), t('usage')]}
              rightAlignedColumns={[1, 2, 3, 4]}
              rows={report.budgets.map(row => [
                row.name,
                Formatter.currency.formatBalance(row.budget, currency),
                Formatter.currency.formatBalance(row.spent, currency),
                Formatter.currency.formatBalance(row.remaining, currency),
                row.utilization.toFixed(1) + '%',
              ])}
            />
          </Card.Body>
        </Card>
      )}
    </>
  );
};
