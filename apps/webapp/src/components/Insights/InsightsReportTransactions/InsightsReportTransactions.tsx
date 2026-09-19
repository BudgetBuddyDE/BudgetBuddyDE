import type {TExpandedTransaction} from '@budgetbuddyde/api/types';
import {Stack} from '@mui/material';
import React from 'react';
import {ActionPaper} from '@/components/ActionPaper';
import {Card} from '@/components/Card';
import {Pagination} from '@/components/Table/Pagination';
import {Formatter} from '@/utils/Formatter';
import {ReportTable} from '../ReportTable/ReportTable';

export type InsightsReportTransactionsProps = {
  transactions: TExpandedTransaction[];
  transactionCount: number;
  transactionPage: number;
  transactionRowsPerPage: number;
  income: number;
  expenses: number;
  onTransactionPageChange: React.Dispatch<React.SetStateAction<number>>;
  onTransactionRowsPerPageChange: (rowsPerPage: number) => void;
};

export const InsightsReportTransactions: React.FC<InsightsReportTransactionsProps> = ({
  transactions,
  transactionCount,
  transactionPage,
  transactionRowsPerPage,
  income,
  expenses,
  onTransactionPageChange,
  onTransactionRowsPerPageChange,
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
