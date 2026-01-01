import type {IGetAllTransactionsQuery} from '@budgetbuddyde/api/transaction';
import {apiClient} from '@/apiClient';
import {createEntitySlice} from '../createEntitySlice';

export const transactionSlice = createEntitySlice('transaction', query => {
  const modifiedQuery = {...query} as IGetAllTransactionsQuery;
  if (modifiedQuery.$dateTo === undefined) {
    modifiedQuery.$dateTo = new Date();
  }

  return apiClient.backend.transaction.getAll(modifiedQuery);
});
