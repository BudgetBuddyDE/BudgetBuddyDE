import React from 'react';

import {useTransactions} from '../useTransactions.hook';
import {type TTransactionListProps, TransactionList} from './TransactionList.component';

export type TLatestTransactionsListProps = Pick<TTransactionListProps, 'onAddEntity'>;

/**
 * TODO: Instead of using the `useTransactions` hook, we should use the `getLatestTransactions(n)` function directly which should fetch the transactions from the backend.
 */
export const LatestTransactionsList: React.FC<TLatestTransactionsListProps> = ({onAddEntity}) => {
  const {isLoading, data} = useTransactions();
  return (
    <TransactionList
      isLoading={isLoading}
      title="Transactions"
      subtitle="Your latest transactions"
      data={data?.slice(0, 6) ?? []}
      onAddEntity={onAddEntity}
      noResultsMessage="You haven't made any transactions yet"
    />
  );
};
