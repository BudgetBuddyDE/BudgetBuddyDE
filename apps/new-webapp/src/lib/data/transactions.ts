import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {cache} from 'react';
import {apiClient} from '@/apiClient';
import {getForwardedHeaders} from '@/lib/server-headers';
import {toTransactionApiQuery, type TransactionQuery} from '@/utils/transaction-query';

export interface TransactionPageData {
  transactions: TExpandedTransaction[];
  totalCount: number;
  categories: TCategoryVH[];
  paymentMethods: TPaymentMethodVH[];
  error?: string;
}

const loadReferenceData = cache(async (_userId: string) => {
  const headers = await getForwardedHeaders();
  const [categoryResult, paymentMethodResult] = await Promise.all([
    apiClient.backend.category.getValueHelp({headers, cache: 'no-store'}),
    apiClient.backend.paymentMethod.getValueHelp({headers, cache: 'no-store'}),
  ]);
  return {
    categories: categoryResult[0] ?? [],
    paymentMethods: paymentMethodResult[0] ?? [],
    failed: Boolean(categoryResult[1] || paymentMethodResult[1]),
  };
});

export async function loadTransactionPage(userId: string, query: TransactionQuery): Promise<TransactionPageData> {
  const headers = await getForwardedHeaders();
  const [transactionResult, references] = await Promise.all([
    apiClient.backend.transaction.getAll(toTransactionApiQuery(query), {headers, cache: 'no-store'}),
    loadReferenceData(userId),
  ]);
  const [response, transactionError] = transactionResult;
  return {
    transactions: response?.data ?? [],
    totalCount: response?.totalCount ?? 0,
    categories: references.categories,
    paymentMethods: references.paymentMethods,
    error:
      transactionError || references.failed ? 'Transactions and their reference data could not be loaded.' : undefined,
  };
}
