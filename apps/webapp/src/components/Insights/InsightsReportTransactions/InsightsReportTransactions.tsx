'use client';

import type {TExpandedTransaction} from '@budgetbuddyde/api/types';
import {Stack} from '@mui/material';
import React from 'react';
import {ActionPaper} from '@/components/ActionPaper';
import {Card} from '@/components/Card';
import {Pagination} from '@/components/Table/Pagination';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {useCurrencyFormatter} from '@/hooks/useCurrencyFormatter';
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
  const t = useAppTranslations();
  const currencyFormatter = useCurrencyFormatter();
  return (
    <Card>
      <Card.Header>
        <Stack>
          <Card.Title>
            {t('Executed transactions (')}
            {transactionCount})
          </Card.Title>
          <Card.Subtitle>
            {t('Filtered transactions behind this report. Volume:')}{' '}
            {currencyFormatter.formatBalance(income + expenses)}
          </Card.Subtitle>
        </Stack>
      </Card.Header>
      <Card.Body>
        <ReportTable
          headers={[t('Date'), t('Receiver'), t('Category'), t('Payment method'), t('Amount')]}
          rightAlignedColumns={[4]}
          rows={transactions.map(transaction => [
            Formatter.date.formatWithPattern(new Date(transaction.processedAt), 'dd.MM.yyyy'),
            transaction.receiver,
            transaction.category.name,
            transaction.paymentMethod.name,
            currencyFormatter.formatBalance(transaction.transferAmount),
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
