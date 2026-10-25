import AddIcon from '@mui/icons-material/AddRounded';
import {getTranslations} from 'next-intl/server';
import {apiClient} from '@/apiClient';
import {IntentButton} from '@/components/IBN';
import {headers} from '@/lib/headers';
import {logger} from '@/logger';
import {TransactionList, type TransactionListProps} from './TransactionList';

export type LatestTransactionsListProps = Pick<TransactionListProps, 'onAddEntity'>;

export const LatestTransactionsList = async ({onAddEntity}: LatestTransactionsListProps) => {
  const t = await getTranslations('TransactionList');
  const clientHeaders = await headers();
  const [transactions, error] = await apiClient.backend.transaction.getAll(
    {
      to: 6,
      $dateTo: new Date(),
    },
    {headers: clientHeaders},
  );
  if (error) {
    logger.error('Failed to fetch latest transactions', error);
    throw error;
  }
  return (
    <TransactionList
      title={t('title')}
      subtitle={t('latestTransactions')}
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
          aria-label={t('createTransaction')}
          color="primary"
        >
          <AddIcon />
        </IntentButton>
      }
      noResultsMessage={t('noTransactions')}
    />
  );
};
