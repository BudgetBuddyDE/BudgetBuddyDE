import AddIcon from '@mui/icons-material/AddRounded';
import {apiClient} from '@/apiClient';
import {IntentButton} from '@/components/IBN';
import {headers} from '@/lib/headers';
import {getAppTranslations} from '@/lib/i18n/server';
import {logger} from '@/logger';
import {TransactionList, type TransactionListProps} from './TransactionList';

export type LatestTransactionsListProps = Pick<TransactionListProps, 'onAddEntity'>;

export const LatestTransactionsList = async ({onAddEntity}: LatestTransactionsListProps) => {
  const t = await getAppTranslations();
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
      title={t('Transactions')}
      subtitle={t('Your latest transactions')}
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
          aria-label={t('Create Transaction')}
          color="primary"
        >
          <AddIcon />
        </IntentButton>
      }
      noResultsMessage={t("You haven't made any transactions yet")}
    />
  );
};
