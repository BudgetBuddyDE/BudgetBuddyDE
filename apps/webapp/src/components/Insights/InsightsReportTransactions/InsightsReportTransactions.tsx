import type {TExpandedTransaction} from '@budgetbuddyde/api/types';
import {Button, Stack} from '@mui/material';
import React from 'react';
import {ActionPaper} from '@/components/ActionPaper';
import {Card} from '@/components/Card';
import {ErrorAlert} from '@/components/ErrorAlert';
import {CircularProgress} from '@/components/Loading';
import {Pagination} from '@/components/Table/Pagination';
import {Formatter} from '@/utils/Formatter';
import {ReportTable} from '../ReportTable/ReportTable';

export type InsightsReportTransactionsProps = {
  transactions: TExpandedTransaction[];
  transactionCount: number;
  transactionPage: number;
  transactionRowsPerPage: number;
  transactionsError?: Error | null;
  transactionsLoading?: boolean;
  income: number;
  expenses: number;
  onTransactionPageChange: (page: number) => void;
  onTransactionRowsPerPageChange: (rowsPerPage: number) => void;
  onRetry?: () => void;
};

export const InsightsReportTransactions: React.FC<InsightsReportTransactionsProps> = ({
  transactions,
  transactionCount,
  transactionPage,
  transactionRowsPerPage,
  transactionsError = null,
  transactionsLoading = false,
  income,
  expenses,
  onTransactionPageChange,
  onTransactionRowsPerPageChange,
  onRetry,
}) => {
  return (
    <Card>
      <Card.Header>
        <Stack>
          <Card.Title>Executed transactions ({transactionCount})</Card.Title>
          <Card.Subtitle>
            Filtered transactions behind this report. Volume: {Formatter.currency.formatBalance(income + expenses)}
          </Card.Subtitle>
        </Stack>
      </Card.Header>
      <Card.Body>
        {transactionsError && (
          <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
            <ErrorAlert error={transactionsError} sx={{flexGrow: 1}} />
            {onRetry && <Button onClick={onRetry}>Retry transactions</Button>}
          </Stack>
        )}
        {transactionsLoading && transactions.length === 0 && <CircularProgress />}
        <ReportTable
          headers={['Date', 'Receiver', 'Category', 'Payment method', 'Amount']}
          rightAlignedColumns={[4]}
          rows={transactions.map(transaction => [
            Formatter.date.formatWithPattern(new Date(transaction.processedAt), 'dd.MM.yyyy'),
            transaction.receiver,
            transaction.category.name,
            transaction.paymentMethod.name,
            Formatter.currency.formatBalance(transaction.transferAmount),
          ])}
        />
      </Card.Body>
      <Card.Footer>
        <ActionPaper sx={{width: 'fit-content', ml: 'auto'}}>
          <Pagination
            count={transactionCount}
            page={transactionPage}
            rowsPerPage={transactionRowsPerPage}
            rowsPerPageOptions={[10, 15, 25, 50, 100]}
            onPageChange={onTransactionPageChange}
            onRowsPerPageChange={onTransactionRowsPerPageChange}
          />
        </ActionPaper>
      </Card.Footer>
    </Card>
  );
};
