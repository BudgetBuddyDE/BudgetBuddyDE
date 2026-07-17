import type {TPaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
  deletePaymentMethod,
  inspectPaymentMethodImpact,
  mergePaymentMethods,
  paymentMethodToDraft,
  savePaymentMethod,
} from './payment-method-mutations';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  merge: vi.fn(),
  transactions: vi.fn(),
  recurring: vi.fn(),
}));
vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      paymentMethod: {create: mocks.create, updateById: mocks.update, deleteById: mocks.remove, merge: mocks.merge},
      transaction: {getAll: mocks.transactions},
      recurringPayment: {getAll: mocks.recurring},
    },
  },
}));
const id = '00000000-0000-4000-8000-000000000001' as TPaymentMethod['id'];

describe('payment method mutations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps and validates the editable contract', async () => {
    expect(paymentMethodToDraft()).toMatchObject({type: 'other', status: 'active'});
    await expect(savePaymentMethod({...paymentMethodToDraft(), name: 'Card'})).resolves.toEqual({
      success: false,
      error: 'Enter a provider.',
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('creates normalized active or inactive methods', async () => {
    mocks.create.mockResolvedValue([{data: []}, null]);
    await expect(
      savePaymentMethod({
        name: ' Visa ',
        type: 'card',
        status: 'inactive',
        provider: ' Bank ',
        address: ' 1234 ',
        description: '',
      }),
    ).resolves.toEqual({success: true});
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({name: 'Visa', status: 'inactive'}));
  });

  it('protects in-use methods and supports controlled merges', async () => {
    mocks.transactions.mockResolvedValue([{totalCount: 3}, null]);
    mocks.recurring.mockResolvedValue([{totalCount: 0}, null]);
    await expect(inspectPaymentMethodImpact(id)).resolves.toEqual({transactions: 3, recurringPayments: 0});
    await expect(deletePaymentMethod(id)).resolves.toBe(false);
    expect(mocks.remove).not.toHaveBeenCalled();
    mocks.merge.mockResolvedValue([{data: {}}, null]);
    await expect(mergePaymentMethods([id], id)).resolves.toBe(true);
  });
});
