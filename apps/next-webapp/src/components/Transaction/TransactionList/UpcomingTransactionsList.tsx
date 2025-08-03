import React from 'react';

import { type TransactionListProps, TransactionList } from './TransactionList';
import { TransactionService } from '@/services/Transaction.service';
import { Formatter } from '@/utils/Formatter';
import { headers } from 'next/headers';

export type UpcomingTransactionsList = Pick<TransactionListProps, 'onAddEntity'>;

export const UpcomingTransactionsList: React.FC<UpcomingTransactionsList> = async ({
  onAddEntity,
}) => {
  const [transactions, error] = await TransactionService.getTransactions(
    {
      $filter: `processedAt ge ${Formatter.date.formatWithPattern(new Date(), 'yyyy-MM-dd')}`,
      $top: 6,
    },
    { headers: await headers() }
  );
  if (error) throw error;

  return (
    <TransactionList
      title="Transactions"
      subtitle="Your upcoming transactions"
      data={transactions.map((t) => ({
        ID: t.ID,
        receiver: t.receiver,
        processedAt: t.processedAt,
        transferAmount: t.transferAmount,
        category: {
          ID: t.toCategory.ID,
          name: t.toCategory.name,
        },
        paymentMethod: {
          ID: t.toPaymentMethod.ID,
          name: t.toPaymentMethod.name,
        },
      }))}
      onAddEntity={onAddEntity}
      noResultsMessage="You don't have any upcoming transactions for this month"
    />
  );
};
