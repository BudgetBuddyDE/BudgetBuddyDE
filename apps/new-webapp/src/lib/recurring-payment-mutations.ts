import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import type {
  TCreateOrUpdateRecurringPaymentPayload,
  TExpandedRecurringPayment,
} from '@budgetbuddyde/api/recurringPayment';
import {apiClient} from '@/apiClient';
import {parseLocalDate, toDateInputValue} from '@/utils/date';
import {minorUnitsToApiAmount, parseMoneyToMinorUnits} from '@/utils/money';

export interface RecurringPaymentDraft {
  amount: string;
  type: 'income' | 'expense';
  nextExecutionAt: string;
  interval: 'monthly' | 'quarterly' | 'yearly';
  paused: boolean;
  categoryId: string;
  paymentMethodId: string;
  receiver: string;
  information: string;
}

export function recurringPaymentToDraft(payment?: TExpandedRecurringPayment): RecurringPaymentDraft {
  return payment
    ? {
        amount: Math.abs(payment.transferAmount).toFixed(2),
        type: payment.transferAmount < 0 ? 'expense' : 'income',
        nextExecutionAt: toDateInputValue(payment.nextExecutionAt),
        interval: payment.interval,
        paused: payment.paused,
        categoryId: payment.category.id,
        paymentMethodId: payment.paymentMethod.id,
        receiver: payment.receiver,
        information: payment.information ?? '',
      }
    : {
        amount: '',
        type: 'expense',
        nextExecutionAt: toDateInputValue(new Date()),
        interval: 'monthly',
        paused: false,
        categoryId: '',
        paymentMethodId: '',
        receiver: '',
        information: '',
      };
}

export async function saveRecurringPayment(
  draft: RecurringPaymentDraft,
  id?: string,
): Promise<{success: boolean; error?: string}> {
  const minor = parseMoneyToMinorUnits(draft.amount);
  if (minor === null || minor <= 0) return {success: false, error: 'Enter a valid amount greater than zero.'};
  const nextDate = parseLocalDate(draft.nextExecutionAt);
  if (!nextDate) return {success: false, error: 'Enter a valid next execution date.'};
  if (!draft.categoryId || !draft.paymentMethodId)
    return {success: false, error: 'Select a category and payment method.'};
  if (!draft.receiver.trim()) return {success: false, error: 'Enter a receiver or source.'};
  const payload: TCreateOrUpdateRecurringPaymentPayload = {
    executeAt: nextDate.getDate(),
    interval: draft.interval,
    nextExecutionAt: nextDate,
    paused: draft.paused,
    categoryId: draft.categoryId as TCreateOrUpdateRecurringPaymentPayload['categoryId'],
    paymentMethodId: draft.paymentMethodId as TCreateOrUpdateRecurringPaymentPayload['paymentMethodId'],
    receiver: draft.receiver.trim(),
    transferAmount: minorUnitsToApiAmount(minor, draft.type),
    information: draft.information.trim() || null,
  };
  const [, error] = id
    ? await apiClient.backend.recurringPayment.updateById(id, payload)
    : await apiClient.backend.recurringPayment.create(payload);
  return error ? {success: false, error: 'The recurring payment could not be saved.'} : {success: true};
}

export async function setRecurringPaymentPaused(payment: TExpandedRecurringPayment, paused: boolean): Promise<boolean> {
  const [, error] = await apiClient.backend.recurringPayment.updateById(payment.id, {paused});
  return !error;
}

export async function executeRecurringPayment(id: string): Promise<boolean> {
  const [, error] = await apiClient.backend.recurringPayment.executePayment(id);
  return !error;
}

export async function deleteRecurringPayment(id: string): Promise<boolean> {
  const [, error] = await apiClient.backend.recurringPayment.deleteById(id);
  return !error;
}

export type RecurringReferences = {categories: TCategoryVH[]; paymentMethods: TPaymentMethodVH[]};
