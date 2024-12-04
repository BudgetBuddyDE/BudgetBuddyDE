import {type TPaymentMethod, type TTransaction} from '@budgetbuddyde/types';
import {subDays} from 'date-fns';

import {PaymentMethodService} from '@/features/PaymentMethod';
import {type TPaymentMethodAutocompleteOption} from '@/features/PaymentMethod/Autocomplete';

describe('sortAutocompleteOptionsByTransactionUsage', () => {
  it('should return an empty array if payment-methods is empty', () => {
    const paymentMethods: TPaymentMethod[] = [];
    const transactions: TTransaction[] = [];
    const result = PaymentMethodService.sortAutocompleteOptionsByTransactionUsage(paymentMethods, transactions);
    expect(result).toEqual([]);
  });

  it('should return autocomplete options sorted by transaction usage', () => {
    const paymentMethods = [
      {id: '1', name: 'Payment Method 1', provider: 'Provider 1'},
      {id: '2', name: 'Payment Method 2', provider: 'Provider 2'},
      {id: '3', name: 'Payment Method 3', provider: 'Provider 3'},
    ] as TPaymentMethod[];
    const transactions = [
      {expand: {payment_method: paymentMethods[0]}, processed_at: new Date()},
      {expand: {payment_method: paymentMethods[1]}, processed_at: new Date()},
      {expand: {payment_method: paymentMethods[0]}, processed_at: new Date()},
      {expand: {payment_method: paymentMethods[2]}, processed_at: new Date()},
    ] as TTransaction[];
    const result = PaymentMethodService.sortAutocompleteOptionsByTransactionUsage(paymentMethods, transactions);

    const expected: TPaymentMethodAutocompleteOption[] = [
      {id: '1', label: PaymentMethodService.getAutocompleteLabel(paymentMethods[0])},
      {id: '2', label: PaymentMethodService.getAutocompleteLabel(paymentMethods[1])},
      {id: '3', label: PaymentMethodService.getAutocompleteLabel(paymentMethods[2])},
    ];
    expect(result).toEqual(expected);
  });

  it('should return autocomplete options sorted by transaction usage within the specified days', () => {
    const paymentMethods = [
      {id: '1', name: 'Payment Method 1', provider: 'Provider 1'},
      {id: '2', name: 'Payment Method 2', provider: 'Provider 2'},
      {id: '3', name: 'Payment Method 3', provider: 'Provider 3'},
    ] as TPaymentMethod[];
    const transactions = [
      {expand: {payment_method: paymentMethods[1]}, processed_at: subDays(new Date(), 20)},
      {expand: {payment_method: paymentMethods[0]}, processed_at: subDays(new Date(), 10)},
      {expand: {payment_method: paymentMethods[0]}, processed_at: subDays(new Date(), 5)},
      {expand: {payment_method: paymentMethods[2]}, processed_at: subDays(new Date(), 15)},
    ] as TTransaction[];
    const result = PaymentMethodService.sortAutocompleteOptionsByTransactionUsage(paymentMethods, transactions, 15);

    const expected: TPaymentMethodAutocompleteOption[] = [
      {id: '1', label: PaymentMethodService.getAutocompleteLabel(paymentMethods[0])},
      {id: '3', label: PaymentMethodService.getAutocompleteLabel(paymentMethods[2])},
      {id: '2', label: PaymentMethodService.getAutocompleteLabel(paymentMethods[1])},
    ];
    expect(result).toEqual(expected);
  });

  it('should return autocomplete options sorted by transaction usage with default days', () => {
    const paymentMethods = [
      {id: '1', name: 'Payment Method 1', provider: 'Provider 1'},
      {id: '2', name: 'Payment Method 2', provider: 'Provider 2'},
      {id: '3', name: 'Payment Method 3', provider: 'Provider 3'},
    ] as TPaymentMethod[];
    const transactions = [
      {expand: {payment_method: paymentMethods[0]}, processed_at: subDays(new Date(), 10)},
      {expand: {payment_method: paymentMethods[2]}, processed_at: subDays(new Date(), 20)},
      {expand: {payment_method: paymentMethods[0]}, processed_at: subDays(new Date(), 5)},
      {expand: {payment_method: paymentMethods[1]}, processed_at: subDays(new Date(), 15)},
      {expand: {payment_method: paymentMethods[2]}, processed_at: subDays(new Date(), 31)},
      {expand: {payment_method: paymentMethods[2]}, processed_at: subDays(new Date(), 31)},
    ] as TTransaction[];
    const result = PaymentMethodService.sortAutocompleteOptionsByTransactionUsage(paymentMethods, transactions);

    const expected: TPaymentMethodAutocompleteOption[] = [
      {id: '1', label: PaymentMethodService.getAutocompleteLabel(paymentMethods[0])},
      {id: '2', label: PaymentMethodService.getAutocompleteLabel(paymentMethods[1])},
      {id: '3', label: PaymentMethodService.getAutocompleteLabel(paymentMethods[2])},
    ];
    expect(result).toEqual(expected);
  });
});
describe('filter', () => {
  it('should return an empty array if paymentMethods is empty', () => {
    const paymentMethods: TPaymentMethod[] = [];
    const keyword = 'keyword';
    const result = PaymentMethodService.filter(paymentMethods, keyword);
    expect(result).toEqual([]);
  });

  it('should return an empty array if no paymentMethod matches the keyword', () => {
    const paymentMethods = [
      {id: '1', name: 'Payment Method 1', provider: 'Provider 1', description: 'Description 1'},
      {id: '2', name: 'Payment Method 2', provider: 'Provider 2', description: 'Description 2'},
      {id: '3', name: 'Payment Method 3', provider: 'Provider 3', description: 'Description 3'},
    ] as TPaymentMethod[];
    const keyword = 'keyword';
    const result = PaymentMethodService.filter(paymentMethods, keyword);
    expect(result).toEqual([]);
  });

  it('should return paymentMethods that match the keyword', () => {
    const paymentMethods = [
      {id: '1', name: 'Payment Method 1', provider: 'Provider 1', description: 'Description 1'},
      {id: '2', name: 'Payment Method 2', provider: 'Provider 2', description: 'Description 2'},
      {id: '3', name: 'Payment Method 3', provider: 'Provider 3', description: 'Description 3'},
    ] as TPaymentMethod[];
    const keyword = 'method';
    const result = PaymentMethodService.filter(paymentMethods, keyword);
    const expected = [
      {id: '1', name: 'Payment Method 1', provider: 'Provider 1', description: 'Description 1'},
      {id: '2', name: 'Payment Method 2', provider: 'Provider 2', description: 'Description 2'},
      {id: '3', name: 'Payment Method 3', provider: 'Provider 3', description: 'Description 3'},
    ] as TPaymentMethod[];
    expect(result).toEqual(expected);
  });

  it('should return paymentMethods that match the keyword (case-insensitive)', () => {
    const paymentMethods = [
      {id: '1', name: 'Payment Method 1', provider: 'Provider 1', description: 'Description 1'},
      {id: '2', name: 'Payment Method 2', provider: 'Provider 2', description: 'Description 2'},
      {id: '3', name: 'Payment Method 3', provider: 'Provider 3', description: 'Description 3'},
    ] as TPaymentMethod[];
    const keyword = 'METHOD';
    const result = PaymentMethodService.filter(paymentMethods, keyword);
    const expected = [
      {id: '1', name: 'Payment Method 1', provider: 'Provider 1', description: 'Description 1'},
      {id: '2', name: 'Payment Method 2', provider: 'Provider 2', description: 'Description 2'},
      {id: '3', name: 'Payment Method 3', provider: 'Provider 3', description: 'Description 3'},
    ] as TPaymentMethod[];
    expect(result).toEqual(expected);
  });

  it('should return paymentMethods that match the keyword (partial match)', () => {
    const paymentMethods = [
      {id: '1', name: 'Payment Method 1', provider: 'Provider 1', description: 'Description 1'},
      {id: '2', name: 'Payment Method 2', provider: 'Provider 2', description: 'Description 2'},
      {id: '3', name: 'Payment Method 3', provider: 'Provider 3', description: 'Description 3'},
    ] as TPaymentMethod[];
    const keyword = '1';
    const result = PaymentMethodService.filter(paymentMethods, keyword);
    const expected = [
      {id: '1', name: 'Payment Method 1', provider: 'Provider 1', description: 'Description 1'},
    ] as TPaymentMethod[];
    expect(result).toEqual(expected);
  });

  it('should return paymentMethods that match the keyword (partial match, case-insensitive)', () => {
    const paymentMethods = [
      {id: '1', name: 'Payment Method 1', provider: 'Provider 1', description: 'Description 1'},
      {id: '2', name: 'Payment Method 2', provider: 'Provider 2', description: 'Description 2'},
      {id: '3', name: 'Payment Method 3', provider: 'Provider 3', description: 'Description 3'},
    ] as TPaymentMethod[];
    const keyword = 'METHOD';
    const result = PaymentMethodService.filter(paymentMethods, keyword);
    const expected = [
      {id: '1', name: 'Payment Method 1', provider: 'Provider 1', description: 'Description 1'},
      {id: '2', name: 'Payment Method 2', provider: 'Provider 2', description: 'Description 2'},
      {id: '3', name: 'Payment Method 3', provider: 'Provider 3', description: 'Description 3'},
    ] as TPaymentMethod[];
    expect(result).toEqual(expected);
  });
});
