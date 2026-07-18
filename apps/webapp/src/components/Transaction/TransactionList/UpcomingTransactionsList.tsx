import AddIcon from '@mui/icons-material/AddRounded';
import {addDays} from 'date-fns';
import {apiClient} from '@/apiClient';
import {IntentButton} from '@/components/IBN';
import {headers} from '@/lib/headers';
import {logger} from '@/logger';
import {TransactionList, type TransactionListProps} from './TransactionList';

export type UpcomingTransactionsList = Pick<TransactionListProps, 'onAddEntity'>;

export const UpcomingTransactionsList = async ({onAddEntity}: UpcomingTransactionsList) => {
  const [transactions, error] = await apiClient.backend.transaction.getAll(
    {
      to: 6,
      $dateFrom: addDays(new Date(), 1),
    },
    {headers: await headers()},
  );
  if (error) {
    logger.error(error.message);
    throw error;
  }
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
      headerAction={
        <IntentButton
          intent={{entity: 'transaction', action: 'create'}}
          iconButton
          aria-label="Create Transaction"
          color="primary"
        >
          <AddIcon />
        </IntentButton>
      }
      noResultsMessage="You don't have any upcoming transactions for this month"
    />
  );
};
