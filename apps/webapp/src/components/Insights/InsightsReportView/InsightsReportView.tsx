import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import type {TExpandedTransaction} from '@budgetbuddyde/api/types';
import {Box, Button, LinearProgress, Skeleton, Stack} from '@mui/material';
import React from 'react';
import {ErrorAlert} from '@/components/ErrorAlert';
import {InsightsReportAnalysis} from '../InsightsReportAnalysis/InsightsReportAnalysis';
import {InsightsReportCharts} from '../InsightsReportCharts';
import {InsightsReportSummaryCards} from '../InsightsReportSummaryCards/InsightsReportSummaryCards';
import {InsightsReportTransactions} from '../InsightsReportTransactions/InsightsReportTransactions';

export type InsightsReportViewProps = {
  report: TInsightsReport | null;
  error: Error | null;
  loading: boolean;
  categories: TCategoryVH[];
  transactions: TExpandedTransaction[];
  transactionCount: number;
  transactionPage: number;
  transactionRowsPerPage: number;
  transactionsError?: Error | null;
  transactionsLoading?: boolean;
  onTransactionPageChange: (page: number) => void;
  onTransactionRowsPerPageChange: (rowsPerPage: number) => void;
  onRetryTransactions?: () => void;
  onRetryReport?: () => void;
};

export const InsightsReportView: React.FC<InsightsReportViewProps> = ({
  report,
  error,
  loading,
  categories,
  transactions,
  transactionCount,
  transactionPage,
  transactionRowsPerPage,
  transactionsError,
  transactionsLoading,
  onTransactionPageChange,
  onTransactionRowsPerPageChange,
  onRetryTransactions,
  onRetryReport,
}) => {
  transactionsError = null;
  transactionsLoading = false;
  const initialLoading = loading && !report;
  const refreshing = loading && Boolean(report);
  const categoryIds = new Set<string>(categories.map(category => category.id));
  const selectedCategoryRows =
    report?.categories.filter(row => categoryIds.size === 0 || categoryIds.has(row.category.id)) ?? [];

  return (
    <>
      {error && (
        <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
          <ErrorAlert error={error} sx={{flexGrow: 1}} />
          {onRetryReport && <Button onClick={onRetryReport}>Retry report</Button>}
        </Stack>
      )}
      {initialLoading ? (
        <Skeleton variant="rounded" height={520} />
      ) : report ? (
        <Box sx={{position: 'relative'}}>
          {refreshing && (
            <LinearProgress
              aria-label="Refreshing insights report"
              sx={{position: 'absolute', top: -8, left: 0, right: 0, zIndex: 1, borderRadius: 1}}
            />
          )}
          <Stack spacing={2}>
            <InsightsReportSummaryCards summary={report.summary} />
            <InsightsReportCharts report={report} />
            <InsightsReportAnalysis report={report} selectedCategoryRows={selectedCategoryRows} />
            <InsightsReportTransactions
              transactions={transactions}
              transactionCount={transactionCount}
              transactionPage={transactionPage}
              transactionRowsPerPage={transactionRowsPerPage}
              transactionsError={transactionsError}
              transactionsLoading={transactionsLoading}
              income={report.summary.income.value}
              expenses={report.summary.expenses.value}
              onTransactionPageChange={onTransactionPageChange}
              onTransactionRowsPerPageChange={onTransactionRowsPerPageChange}
              onRetry={onRetryTransactions}
            />
          </Stack>
        </Box>
      ) : null}
    </>
  );
};
