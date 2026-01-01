import {addDays} from 'date-fns';
import type React from 'react';
import {apiClient} from '@/apiClient';
import {headers} from '@/lib/headers';
import {TransactionList, type TransactionListProps} from './TransactionList';

export type UpcomingTransactionsList = Pick<TransactionListProps, 'onAddEntity'>;

export const UpcomingTransactionsList: React.FC<UpcomingTransactionsList> = async ({onAddEntity}) => {
  const [transactions, error] = await apiClient.backend.transaction.getAll(
    {
      to: 6,
      $dateFrom: addDays(new Date(), 1),
    },
    {headers: await headers()},
  );
  if (error) throw error;

  return (
    <TransactionList
      title="Transactions"
      subtitle="Your upcoming transactions"
      data={(transactions.data ?? []).map(t => ({
        ID: t.id,
        receiver: t.receiver,
        processedAt: t.processedAt as Date,
        transferAmount: t.transferAmount,
        category: {
          ID: t.category.id,
          name: t.category.name,
        },
        paymentMethod: {
          ID: t.paymentMethod.id,
          name: t.paymentMethod.name,
        },
      }))}
      onAddEntity={onAddEntity}
      noResultsMessage="You don't have any upcoming transactions for this month"
    />
  );
};
