import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {apiClient} from '@/apiClient';
import {getForwardedHeaders} from '@/lib/server-headers';

export async function loadImportReferences(): Promise<{
  categories: TCategoryVH[];
  paymentMethods: TPaymentMethodVH[];
  error?: string;
}> {
  const headers = await getForwardedHeaders();
  const [categories, methods] = await Promise.all([
    apiClient.backend.category.getValueHelp({headers, cache: 'no-store'}),
    apiClient.backend.paymentMethod.getValueHelp({headers, cache: 'no-store'}),
  ]);
  return {
    categories: categories[0] ?? [],
    paymentMethods: methods[0] ?? [],
    error: categories[1] || methods[1] ? 'Import reference data could not be loaded.' : undefined,
  };
}
