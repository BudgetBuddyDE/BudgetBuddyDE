import type {TPaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import {apiClient} from '@/apiClient';
import {getForwardedHeaders} from '@/lib/server-headers';

export async function loadPaymentMethodPage(
  search: string,
  page: number,
  pageSize: number,
): Promise<{paymentMethods: TPaymentMethod[]; totalCount: number; error?: string}> {
  const headers = await getForwardedHeaders();
  const from = (page - 1) * pageSize;
  const [response, error] = await apiClient.backend.paymentMethod.getAll(
    {search: search || undefined, from, to: from + pageSize},
    {headers, cache: 'no-store'},
  );
  return {
    paymentMethods: response?.data ?? [],
    totalCount: response?.totalCount ?? 0,
    error: error ? 'Payment methods could not be loaded.' : undefined,
  };
}
