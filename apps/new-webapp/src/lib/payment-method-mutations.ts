import type {TPaymentMethod, TCreateOrUpdatePaymentMethodPayload} from '@budgetbuddyde/api/paymentMethod';
import {apiClient} from '@/apiClient';

export interface PaymentMethodDraft {
  name: string;
  type: 'cash' | 'bank' | 'card' | 'wallet' | 'other';
  status: 'active' | 'inactive';
  provider: string;
  address: string;
  description: string;
}

export function paymentMethodToDraft(method?: TPaymentMethod): PaymentMethodDraft {
  return method
    ? {
        name: method.name,
        type: method.type,
        status: method.status,
        provider: method.provider,
        address: method.address,
        description: method.description ?? '',
      }
    : {name: '', type: 'other', status: 'active', provider: '', address: '', description: ''};
}

export async function savePaymentMethod(
  draft: PaymentMethodDraft,
  id?: string,
): Promise<{success: boolean; error?: string}> {
  if (!draft.name.trim()) return {success: false, error: 'Enter a payment method name.'};
  if (!draft.provider.trim()) return {success: false, error: 'Enter a provider.'};
  if (!draft.address.trim()) return {success: false, error: 'Enter an account reference.'};
  const payload: TCreateOrUpdatePaymentMethodPayload = {
    name: draft.name.trim(),
    type: draft.type,
    status: draft.status,
    provider: draft.provider.trim(),
    address: draft.address.trim(),
    description: draft.description.trim() || null,
  };
  const [, error] = id
    ? await apiClient.backend.paymentMethod.updateById(id, payload)
    : await apiClient.backend.paymentMethod.create(payload);
  return error ? {success: false, error: 'The payment method could not be saved.'} : {success: true};
}

export async function inspectPaymentMethodImpact(
  id: TPaymentMethod['id'],
): Promise<{transactions: number; recurringPayments: number} | null> {
  const [transactions, recurring] = await Promise.all([
    apiClient.backend.transaction.getAll({$paymentMethods: [id], from: 0, to: 1}),
    apiClient.backend.recurringPayment.getAll({$paymentMethods: [id], from: 0, to: 1}),
  ]);
  if (transactions[1] || recurring[1]) return null;
  return {transactions: transactions[0]?.totalCount ?? 0, recurringPayments: recurring[0]?.totalCount ?? 0};
}

export async function deletePaymentMethod(id: TPaymentMethod['id']): Promise<boolean> {
  const impact = await inspectPaymentMethodImpact(id);
  if (!impact || impact.transactions || impact.recurringPayments) return false;
  const [, error] = await apiClient.backend.paymentMethod.deleteById(id);
  return !error;
}

export async function mergePaymentMethods(
  source: TPaymentMethod['id'][],
  target: TPaymentMethod['id'],
): Promise<boolean> {
  const [, error] = await apiClient.backend.paymentMethod.merge({source, target});
  return !error;
}
