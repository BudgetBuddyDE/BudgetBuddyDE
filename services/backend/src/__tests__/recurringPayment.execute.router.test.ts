import {beforeEach, describe, expect, it, vi} from 'vitest';
import {requestRouter} from './router.test-utils';
import {recurringPaymentRouter} from '../router/recurringPayment.router';

const {findFirst, createTransaction, invalidateUserCaches} = vi.hoisted(() => ({
  findFirst: vi.fn(),
  createTransaction: vi.fn(),
  invalidateUserCaches: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../db', () => ({
  db: {query: {recurringPayments: {findFirst}}},
}));

vi.mock('../utils/createTransactionFromRecurringPayment', () => ({
  createTransactionFromRecurringPayment: createTransaction,
}));
vi.mock('../middleware/cache.middleware', () => ({invalidateUserCaches}));

const USER_ID = 'user-1';
const PAYMENT_ID = '00000000-0000-4000-8000-000000000001';

const payment = {
  id: PAYMENT_ID,
  ownerId: USER_ID,
  categoryId: '00000000-0000-4000-8000-000000000002',
  paymentMethodId: '00000000-0000-4000-8000-000000000003',
  executionPlan: 'monthly' as const,
  startsOn: '2026-01-01',
  paused: false,
  receiver: 'Test receiver',
  transferAmount: -10,
  information: null,
};

describe('manual recurring payment execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findFirst.mockResolvedValue(payment);
    createTransaction.mockResolvedValue({id: 'transaction-1'});
  });

  it('invalidates transaction, budget, and insight caches after execution', async () => {
    const response = await requestRouter(recurringPaymentRouter, USER_ID, `/${PAYMENT_ID}/execute`, {method: 'POST'});

    expect(response.status).toBe(200);
    expect(invalidateUserCaches).toHaveBeenCalledWith(USER_ID, ['/api/transaction', '/api/budget', '/api/insights']);
  });

  it('does not invalidate dependent caches when execution fails', async () => {
    createTransaction.mockRejectedValueOnce(new Error('insert failed'));

    const response = await requestRouter(recurringPaymentRouter, USER_ID, `/${PAYMENT_ID}/execute`, {method: 'POST'});

    expect(response.status).toBe(500);
    expect(invalidateUserCaches).not.toHaveBeenCalled();
  });
});
