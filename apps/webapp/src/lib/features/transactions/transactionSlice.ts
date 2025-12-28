import {Backend} from '@/services/Backend';
import type {GetAllTransactionsQuery} from '@/services/Transaction.service';
import {createEntitySlice} from '../createEntitySlice';

export const transactionSlice = createEntitySlice('transaction', query => {
  const modifiedQuery = {...query} as GetAllTransactionsQuery;
  if (modifiedQuery.$dateTo === undefined) {
    modifiedQuery.$dateTo = new Date();
  }

  return Backend.transaction.getAll(modifiedQuery);
});
