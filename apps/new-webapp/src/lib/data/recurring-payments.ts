import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import type {TExpandedRecurringPayment} from '@budgetbuddyde/api/recurringPayment';
import {apiClient} from '@/apiClient';
import {getForwardedHeaders} from '@/lib/server-headers';

export async function loadRecurringPaymentPage({
  search,
  page,
  pageSize,
  status,
}: {
  search: string;
  page: number;
  pageSize: number;
  status: 'all' | 'active' | 'paused';
}): Promise<{
  payments: TExpandedRecurringPayment[];
  totalCount: number;
  categories: TCategoryVH[];
  paymentMethods: TPaymentMethodVH[];
  error?: string;
}> {
  const headers = await getForwardedHeaders();
  const from = (page - 1) * pageSize;
  const [paymentResult, categoryResult, methodResult] = await Promise.all([
    apiClient.backend.recurringPayment.getAll(
      {
        search: search || undefined,
        from,
        to: from + pageSize,
        $paused: status === 'all' ? undefined : status === 'paused',
      },
      {headers, cache: 'no-store'},
    ),
    apiClient.backend.category.getValueHelp({headers, cache: 'no-store'}),
    apiClient.backend.paymentMethod.getValueHelp({headers, cache: 'no-store'}),
  ]);
  return {
    payments: paymentResult[0]?.data ?? [],
    totalCount: paymentResult[0]?.totalCount ?? 0,
    categories: categoryResult[0] ?? [],
    paymentMethods: methodResult[0] ?? [],
    error:
      paymentResult[1] || categoryResult[1] || methodResult[1]
        ? 'Recurring payments and reference data could not be loaded.'
        : undefined,
  };
}
