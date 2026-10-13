import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import {Box, FormControl, Grid, InputLabel, MenuItem, Select} from '@mui/material';
import React from 'react';
import {Card} from '@/components/Card';
import {Formatter} from '@/utils/Formatter';
import {ReportTable} from '../ReportTable/ReportTable';

type CategoryMetric = 'expenses' | 'income' | 'balance';
type PaymentMetric = 'count' | 'volume';

export type InsightsReportAnalysisProps = {
  report: TInsightsReport;
  selectedCategoryRows: TInsightsReport['categories'];
};

export const InsightsReportAnalysis: React.FC<InsightsReportAnalysisProps> = ({report, selectedCategoryRows}) => {
  const [categoryMetric, setCategoryMetric] = React.useState<CategoryMetric>('expenses');
  const [paymentMetric, setPaymentMetric] = React.useState<PaymentMetric>('count');

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{xs: 12, lg: 7}}>
          <Card>
            <Card.Header>
              <Card.Title>Category analysis</Card.Title>
              <FormControl size="small" sx={{minWidth: 130}}>
                <InputLabel id="insights-report-category-metric-label">Metric</InputLabel>
                <Select
                  labelId="insights-report-category-metric-label"
                  id="insights-report-category-metric"
                  label="Metric"
                  value={categoryMetric}
                  onChange={event => setCategoryMetric(event.target.value as CategoryMetric)}
                >
                  <MenuItem value="expenses">Expenses</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="balance">Balance</MenuItem>
                </Select>
              </FormControl>
            </Card.Header>
            <Card.Body>
              <ReportTable
                headers={['Category', 'Selected metric', 'Expenses', 'Income', 'Balance', 'Share']}
                rightAlignedColumns={[1, 2, 3, 4, 5]}
                rows={selectedCategoryRows.map(row => [
                  row.category.name,
                  Formatter.currency.formatBalance(row[categoryMetric].value),
                  Formatter.currency.formatBalance(row.expenses.value),
                  Formatter.currency.formatBalance(row.income.value),
                  Formatter.currency.formatBalance(row.balance.value),
                  row.expenseShare.toFixed(1) + '%',
                ])}
              />
            </Card.Body>
          </Card>
        </Grid>
        <Grid size={{xs: 12, lg: 5}}>
          <Card>
            <Card.Header>
              <Card.Title>Payment method usage</Card.Title>
              <FormControl size="small" sx={{minWidth: 110}}>
                <InputLabel id="insights-report-payment-metric-label">Rank by</InputLabel>
                <Select
                  labelId="insights-report-payment-metric-label"
                  id="insights-report-payment-metric"
                  label="Rank by"
                  value={paymentMetric}
                  onChange={event => setPaymentMetric(event.target.value as PaymentMetric)}
                >
                  <MenuItem value="count">Uses</MenuItem>
                  <MenuItem value="volume">Volume</MenuItem>
                </Select>
              </FormControl>
            </Card.Header>
            <Card.Body>
              <ReportTable
                headers={['Method', 'Uses', 'Share', 'Expenses']}
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
                    Formatter.currency.formatBalance(row.expenses.value),
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
              <Card.Title>Current month budget health</Card.Title>
              <Card.Subtitle>Budgets are evaluated independently from the report period</Card.Subtitle>
            </Box>
          </Card.Header>
          <Card.Body>
            <ReportTable
              headers={['Budget', 'Target', 'Spent', 'Remaining', 'Usage']}
              rightAlignedColumns={[1, 2, 3, 4]}
              rows={report.budgets.map(row => [
                row.name,
                Formatter.currency.formatBalance(row.budget),
                Formatter.currency.formatBalance(row.spent),
                Formatter.currency.formatBalance(row.remaining),
                row.utilization.toFixed(1) + '%',
              ])}
            />
          </Card.Body>
        </Card>
      )}
    </>
  );
};
