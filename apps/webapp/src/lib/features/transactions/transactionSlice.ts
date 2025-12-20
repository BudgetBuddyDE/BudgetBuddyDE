import {Backend} from '@/services/Backend';
import {createEntitySlice} from '../createEntitySlice';
import type {GetAllTransactionsQuery} from '@/services/Transaction.service';

export const transactionSlice = createEntitySlice('transaction', query => {
  let modifiedQuery = {...query} as GetAllTransactionsQuery;
  if (modifiedQuery.$dateTo === undefined) {
    modifiedQuery.$dateTo = new Date();
  }

  return Backend.transaction.getAll(modifiedQuery);
});
