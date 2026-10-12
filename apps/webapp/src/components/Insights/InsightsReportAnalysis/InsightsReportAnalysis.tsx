import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import type {IGetInsightsReportQuery} from '@budgetbuddyde/api/interfaces';
import {BarChart} from '@budgetbuddyde/charts';
import {Box, FormControl, Grid, InputLabel, Link, MenuItem, Select, Stack, Typography} from '@mui/material';
import NextLink from 'next/link';
import React from 'react';
import {BudgetUtilizationChart} from '@/components/Budget/SpendingGoals';
import {Card} from '@/components/Card';
import {buildIntentHref} from '@/lib/ibn/url';
import {Formatter} from '@/utils/Formatter';
import {
  categoryComparisonData,
  insightsTransactionHref,
  paymentUsageData,
  type CategoryMetric,
  type PaymentMetric,
} from '../insightsAnalysisData';
import {ReportTable} from '../ReportTable/ReportTable';

export type InsightsReportAnalysisProps = {
  report: TInsightsReport;
  selectedCategoryRows: TInsightsReport['categories'];
  reportQuery?: IGetInsightsReportQuery;
};

export const InsightsReportAnalysis: React.FC<InsightsReportAnalysisProps> = ({
  report,
  selectedCategoryRows,
  reportQuery,
}) => {
  const [categoryMetric, setCategoryMetric] = React.useState<CategoryMetric>('expenses');
  const [paymentMetric, setPaymentMetric] = React.useState<PaymentMetric>('count');
  const comparison = report.comparisonPeriod !== null;
  const categoryData = categoryComparisonData(selectedCategoryRows, categoryMetric, comparison);
  const paymentData = paymentUsageData(report, paymentMetric);
  const receivers = [...report.receivers]
    .filter(row => row.expenses.value > 0)
    .sort((a, b) => b.expenses.value - a.expenses.value);
  const money = Formatter.currency.formatBalance;
  const transactionLink = (label: string, href: string) => (
    <Link component={NextLink} href={href}>
      {label}
    </Link>
  );

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{xs: 12, lg: 7}}>
          <Card>
            <Card.Header>
              <Box>
                <Card.Title>Category analysis</Card.Title>
                <Card.Subtitle>
                  {comparison
                    ? 'Largest changes compared with the previous period'
                    : 'Largest amounts in the selected period'}
                </Card.Subtitle>
              </Box>
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
              <Stack spacing={2}>
                {categoryData.length > 0 && (
                  <BarChart
                    data={categoryData}
                    xKey="label"
                    horizontal
                    height={Math.max(200, categoryData.length * 55)}
                    ariaLabel="Category amounts compared with the previous period"
                    showLegend
                    showZeroLine
                    axisValueFormatter={value => Formatter.currency.shortenBalance(value)}
                    tooltipValueFormatter={money}
                    series={[
                      {
                        key: 'current',
                        label: 'Selected period',
                        role:
                          categoryMetric === 'expenses'
                            ? 'expense'
                            : categoryMetric === 'income'
                              ? 'income'
                              : 'balance',
                      },
                      ...(comparison ? [{key: 'previous', label: 'Previous period', role: 'target' as const}] : []),
                    ]}
                  />
                )}
                <ReportTable
                  headers={['Category', 'Selected metric', 'Expenses', 'Income', 'Balance', 'Share', 'Change']}
                  rightAlignedColumns={[1, 2, 3, 4, 5, 6]}
                  rows={selectedCategoryRows.map(row => [
                    transactionLink(
                      row.category.name,
                      insightsTransactionHref(report, reportQuery, {categories: [row.category.id]}),
                    ),
                    money(row[categoryMetric].value),
                    money(row.expenses.value),
                    money(row.income.value),
                    money(row.balance.value),
                    row.expenseShare.toFixed(1) + '%',
                    row[categoryMetric].absoluteChange === null ? 'N/A' : money(row[categoryMetric].absoluteChange),
                  ])}
                />
              </Stack>
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
                  <MenuItem value="expenses">Expenses</MenuItem>
                </Select>
              </FormControl>
            </Card.Header>
            <Card.Body>
              <Stack spacing={2}>
                {paymentData.some(row => row.value > 0) && (
                  <BarChart
                    data={paymentData.slice(0, 5).map(({id, label, value}) => ({id, label, value}))}
                    xKey="label"
                    horizontal
                    height={Math.max(200, Math.min(paymentData.length, 5) * 50)}
                    ariaLabel={
                      paymentMetric === 'count' ? 'Payment method transaction counts' : 'Payment method expenses'
                    }
                    axisValueFormatter={
                      paymentMetric === 'count' ? String : value => Formatter.currency.shortenBalance(value)
                    }
                    tooltipValueFormatter={paymentMetric === 'count' ? String : money}
                    series={[
                      {
                        key: 'value',
                        label: paymentMetric === 'count' ? 'Uses' : 'Expenses',
                        role: paymentMetric === 'count' ? 'balance' : 'expense',
                      },
                    ]}
                  />
                )}
                <ReportTable
                  headers={['Method', 'Uses', paymentMetric === 'count' ? 'Usage share' : 'Expense share', 'Expenses']}
                  rightAlignedColumns={[1, 2, 3]}
                  rows={paymentData.map(({row}) => [
                    transactionLink(
                      row.paymentMethod.name,
                      insightsTransactionHref(report, reportQuery, {paymentMethods: [row.paymentMethod.id]}),
                    ),
                    String(row.transactionCount.value),
                    (paymentMetric === 'count'
                      ? row.usageShare
                      : report.summary.expenses.value > 0
                        ? (100 * row.expenses.value) / report.summary.expenses.value
                        : 0
                    ).toFixed(1) + '%',
                    money(row.expenses.value),
                  ])}
                />
              </Stack>
            </Card.Body>
          </Card>
        </Grid>
      </Grid>
      {report.budgets && (
        <Card>
          <Card.Header>
            <Box>
              <Card.Title>Current month budget health</Card.Title>
              <Card.Subtitle>
                Current month, independently of report dates, category and payment method filters
              </Card.Subtitle>
            </Box>
          </Card.Header>
          <Card.Body>
            <Stack spacing={2}>
              <BudgetUtilizationChart budgets={report.budgets} />
              <ReportTable
                headers={['Budget', 'Target', 'Spent', 'Remaining', 'Usage']}
                rightAlignedColumns={[1, 2, 3, 4]}
                rows={report.budgets.map(row => [
                  transactionLink(row.name, buildIntentHref({entity: 'budget', action: 'edit', id: row.id})),
                  money(row.budget),
                  money(row.spent),
                  money(row.remaining),
                  row.budget > 0 ? row.utilization.toFixed(1) + '%' : 'No positive limit',
                ])}
              />
            </Stack>
          </Card.Body>
        </Card>
      )}
      <Card>
        <Card.Header>
          <Box>
            <Card.Title>Top expense receivers</Card.Title>
            <Card.Subtitle>Up to ten receivers ranked by recorded expenses in this period</Card.Subtitle>
          </Box>
        </Card.Header>
        <Card.Body>
          <Stack spacing={2}>
            {receivers.length > 0 && (
              <BarChart
                data={receivers.map(row => ({label: row.receiver, expenses: row.expenses.value}))}
                xKey="label"
                horizontal
                height={Math.max(200, receivers.length * 40)}
                ariaLabel="Top receivers by expense amount"
                axisValueFormatter={value => Formatter.currency.shortenBalance(value)}
                tooltipValueFormatter={money}
                series={[{key: 'expenses', label: 'Expenses', role: 'expense'}]}
              />
            )}
            <Typography variant="caption" color="text.secondary">
              Receiver links search transaction text. Counts include all transactions, including income.
            </Typography>
            <ReportTable
              headers={['Receiver', 'Expenses', 'Transactions', 'Average expense']}
              rightAlignedColumns={[1, 2, 3]}
              rows={receivers.map(row => [
                transactionLink(row.receiver, insightsTransactionHref(report, reportQuery, {keyword: row.receiver})),
                money(row.expenses.value),
                String(row.transactionCount.value),
                money(row.averageExpense.value),
              ])}
            />
          </Stack>
        </Card.Body>
      </Card>
    </>
  );
};
