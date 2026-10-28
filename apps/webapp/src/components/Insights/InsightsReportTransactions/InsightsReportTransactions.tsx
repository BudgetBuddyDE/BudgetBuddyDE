import type {TExpandedTransaction} from '@budgetbuddyde/api/types';
import {Stack} from '@mui/material';
import {useTranslations} from 'next-intl';
import React from 'react';
import {ActionPaper} from '@/components/ActionPaper';
import {Card} from '@/components/Card';
import {Pagination} from '@/components/Table/Pagination';
import {Formatter} from '@/utils/Formatter';
import {useCurrencyPreference} from '@/utils/Formatter/PreferenceContext';
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
  const t = useTranslations('InsightsReportTransactions');
  const currency = useCurrencyPreference();
  return (
    <Card>
      <Card.Header>
        <Stack>
          <Card.Title>{t('title', {count: transactionCount})}</Card.Title>
          <Card.Subtitle>
            {t('description')} {t('volume')}: {Formatter.currency.formatBalance(income + expenses, currency)}
          </Card.Subtitle>
        </Stack>
      </Card.Header>
      <Card.Body>
        <ReportTable
          headers={[t('date'), t('receiver'), t('category'), t('paymentMethod'), t('amount')]}
          rightAlignedColumns={[4]}
          rows={transactions.map(transaction => [
            Formatter.date.formatWithPattern(new Date(transaction.processedAt), 'dd.MM.yyyy'),
            transaction.receiver,
            transaction.category.name,
            transaction.paymentMethod.name,
            Formatter.currency.formatBalance(transaction.transferAmount, currency),
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
