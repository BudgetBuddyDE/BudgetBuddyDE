import {type TPaymentMethod} from '@budgetbuddyde/types';

export function getPaymentMethodFromList(
  paymentMethodId: TPaymentMethod['id'],
  paymentMethods: TPaymentMethod[],
): {label: string; value: TPaymentMethod['id']} | undefined {
  const match = paymentMethods.find(paymentMethod => paymentMethod.id === paymentMethodId);
  if (!match) return undefined;
  return {label: `${match.name} • ${match.provider}`, value: match.id};
}
