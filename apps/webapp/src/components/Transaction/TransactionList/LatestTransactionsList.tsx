import {apiClient} from '@/apiClient';
import {headers} from '@/lib/headers';
import {logger} from '@/logger';
import {TransactionList, type TransactionListProps} from './TransactionList';

export type LatestTransactionsListProps = Pick<TransactionListProps, 'onAddEntity'>;

export const LatestTransactionsList = async ({onAddEntity}: LatestTransactionsListProps) => {
  const clientHeaders = await headers();
  const [transactions, error] = await apiClient.backend.transaction.getAll(
    {
      to: 6,
      $dateTo: new Date(),
    },
    {headers: clientHeaders},
  );
  if (error) {
    logger.error(error.message);
    throw error;
  }
  return (
    <TransactionList
      title="Transactions"
      subtitle="Your latest transactions"
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
      noResultsMessage="You haven't made any transactions yet"
    />
  );
};
