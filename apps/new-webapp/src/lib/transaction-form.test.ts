import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {describe, expect, it} from 'vitest';
import {createTransactionDraft, validateTransactionDraft} from './transaction-form';

describe('transaction form model', () => {
  it('builds a draft from an existing expense', () => {
    const transaction = {
      id: 'tx',
      transferAmount: -12.34,
      processedAt: new Date(2026, 6, 16),
      category: {id: 'cat'},
      paymentMethod: {id: 'pay'},
      receiver: 'Market',
      information: null,
    } as unknown as TExpandedTransaction;
    expect(createTransactionDraft(transaction)).toMatchObject({
      id: 'tx',
      amount: '12.34',
      type: 'expense',
      date: '2026-07-16',
      categoryId: 'cat',
      paymentMethodId: 'pay',
    });
  });

  it('validates and normalizes a draft without floating-point parsing', () => {
    const result = validateTransactionDraft({
      amount: '12,34',
      type: 'expense',
      date: '2026-07-16',
      categoryId: '',
      paymentMethodId: 'pay',
      receiver: ' Market ',
      information: ' Food ',
    });
    expect(result.data).toMatchObject({
      categoryId: '',
      transferAmount: -12.34,
      receiver: 'Market',
      information: 'Food',
    });
    expect(result.data?.processedAt.getHours()).toBe(12);
  });

  it('returns field-specific errors for invalid input', () => {
    const result = validateTransactionDraft({
      amount: '1.234',
      type: 'income',
      date: '2026-02-30',
      categoryId: '',
      paymentMethodId: '',
      receiver: ' ',
      information: '',
    });
    expect(result.errors).toEqual({
      amount: 'Enter an amount greater than zero with at most two decimal places.',
      date: 'Enter a valid calendar date.',
      paymentMethodId: 'Select a payment method.',
      receiver: 'Enter a receiver or source.',
    });
  });
});
