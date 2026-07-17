import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import type {TransactionDraft, TransactionDraftErrors} from '@/types/transaction';
import {parseLocalDate, toDateInputValue} from '@/utils/date';
import {minorUnitsToApiAmount, parseMoneyToMinorUnits} from '@/utils/money';

export interface ValidatedTransactionDraft {
  id?: string;
  categoryId: string;
  paymentMethodId: string;
  processedAt: Date;
  receiver: string;
  transferAmount: number;
  information: string | null;
}

export function createTransactionDraft(transaction?: TExpandedTransaction): TransactionDraft {
  if (!transaction) {
    return {
      amount: '',
      type: 'expense',
      date: toDateInputValue(new Date()),
      categoryId: '',
      paymentMethodId: '',
      receiver: '',
      information: '',
    };
  }
  return {
    id: transaction.id,
    amount: Math.abs(transaction.transferAmount).toFixed(2),
    type: transaction.transferAmount < 0 ? 'expense' : 'income',
    date: toDateInputValue(transaction.processedAt),
    categoryId: transaction.category.id,
    paymentMethodId: transaction.paymentMethod.id,
    receiver: transaction.receiver,
    information: transaction.information ?? '',
  };
}

export function validateTransactionDraft(draft: TransactionDraft): {
  data?: ValidatedTransactionDraft;
  errors?: TransactionDraftErrors;
} {
  const errors: TransactionDraftErrors = {};
  const minorUnits = parseMoneyToMinorUnits(draft.amount);
  if (minorUnits === null || minorUnits <= 0)
    errors.amount = 'Enter an amount greater than zero with at most two decimal places.';
  const processedAt = parseLocalDate(draft.date);
  if (!processedAt) errors.date = 'Enter a valid calendar date.';
  if (!draft.paymentMethodId) errors.paymentMethodId = 'Select a payment method.';
  if (!draft.receiver.trim()) errors.receiver = 'Enter a receiver or source.';
  if (Object.keys(errors).length || minorUnits === null || !processedAt) return {errors};
  return {
    data: {
      id: draft.id,
      categoryId: draft.categoryId,
      paymentMethodId: draft.paymentMethodId,
      processedAt,
      receiver: draft.receiver.trim(),
      transferAmount: minorUnitsToApiAmount(minorUnits, draft.type),
      information: draft.information.trim() || null,
    },
  };
}
