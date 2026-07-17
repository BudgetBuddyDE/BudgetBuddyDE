import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
  deleteRecurringPayment,
  executeRecurringPayment,
  recurringPaymentToDraft,
  saveRecurringPayment,
  setRecurringPaymentPaused,
} from './recurring-payment-mutations';

const mocks = vi.hoisted(() => ({create: vi.fn(), update: vi.fn(), execute: vi.fn(), remove: vi.fn()}));
vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      recurringPayment: {
        create: mocks.create,
        updateById: mocks.update,
        executePayment: mocks.execute,
        deleteById: mocks.remove,
      },
    },
  },
}));
const draft = {
  amount: '12.34',
  type: 'expense' as const,
  nextExecutionAt: '2026-07-31',
  interval: 'quarterly' as const,
  paused: false,
  categoryId: 'cat',
  paymentMethodId: 'pay',
  receiver: 'Rent',
  information: '',
};

describe('recurring payment mutations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('defines safe defaults and validates finance fields', async () => {
    expect(recurringPaymentToDraft()).toMatchObject({interval: 'monthly', paused: false});
    await expect(saveRecurringPayment({...draft, amount: 'bad'})).resolves.toEqual({
      success: false,
      error: 'Enter a valid amount greater than zero.',
    });
  });

  it('saves explicit interval and next execution semantics', async () => {
    mocks.create.mockResolvedValue([{data: []}, null]);
    await expect(saveRecurringPayment(draft)).resolves.toEqual({success: true});
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({executeAt: 31, interval: 'quarterly', transferAmount: -12.34}),
    );
  });

  it('supports pause, execution, and deletion outcomes', async () => {
    mocks.update.mockResolvedValue([{data: []}, null]);
    mocks.execute.mockResolvedValue([{data: {}}, null]);
    mocks.remove.mockResolvedValue([{data: []}, null]);
    await expect(setRecurringPaymentPaused({id: 'r'} as never, true)).resolves.toBe(true);
    await expect(executeRecurringPayment('r')).resolves.toBe(true);
    await expect(deleteRecurringPayment('r')).resolves.toBe(true);
  });
});
