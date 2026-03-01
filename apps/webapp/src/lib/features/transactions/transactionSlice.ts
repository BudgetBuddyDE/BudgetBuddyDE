import type {TCategory} from '@budgetbuddyde/api/category';
import type {TPaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import type {IGetAllTransactionsQuery} from '@budgetbuddyde/api/transaction';
import {apiClient} from '@/apiClient';
import {createEntitySlice} from '../createEntitySlice';

export const transactionSlice = createEntitySlice(
  'transaction',
  query => {
    const modifiedQuery = {...query} as IGetAllTransactionsQuery;
    // Default: show all transactions up to today when no explicit date range is set
    if (modifiedQuery.$dateTo === undefined && modifiedQuery.$dateFrom === undefined) {
      modifiedQuery.$dateTo = new Date();
    }
    return apiClient.backend.transaction.getAll(modifiedQuery);
  },
  filters => {
    const extra: Partial<IGetAllTransactionsQuery> = {};
    if (filters.dateFrom) extra.$dateFrom = filters.dateFrom;
    if (filters.dateTo) extra.$dateTo = filters.dateTo;
    if (filters.categories?.length) extra.$categories = filters.categories as TCategory['id'][];
    if (filters.excl_categories?.length) extra.$excl_categories = filters.excl_categories as TCategory['id'][];
    if (filters.paymentMethods?.length) extra.$paymentMethods = filters.paymentMethods as TPaymentMethod['id'][];
    if (filters.excl_paymentMethods?.length)
      extra.$excl_paymentMethods = filters.excl_paymentMethods as TPaymentMethod['id'][];
    return extra;
  },
);
