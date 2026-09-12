import {paymentMethods, recurringPayments, transactions} from '@budgetbuddyde/db/backend';
import {PgDialect} from 'drizzle-orm/pg-core';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {requestRouter} from './router.test-utils';
import {paymentMethodRouter} from '../router/paymentMethod.router';

const {findMany, transaction, info} = vi.hoisted(() => ({
  findMany: vi.fn(),
  transaction: vi.fn(),
  info: vi.fn(),
}));

vi.mock('../db', () => ({
  db: {
    query: {paymentMethods: {findMany}},
    transaction,
  },
}));

vi.mock('../lib', () => ({logger: {info}}));

const USER_ID = 'user-1';
const SOURCE_ID = '00000000-0000-4000-8000-000000000001';
const TARGET_ID = '00000000-0000-4000-8000-000000000002';
type TransactionClient = {
  update: (table: unknown) => ReturnType<typeof returningChain>;
  delete: (table: unknown) => {where: () => unknown; returning: () => Promise<unknown[]>};
};

function returningChain(result: unknown[] = []) {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

describe('payment method merge', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const transactionUpdate = returningChain([]);
    const recurringPaymentUpdate = returningChain([]);
    const deleteChain = {
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };
    const tx = {
      update: vi.fn((table: unknown) => {
        if (table === transactions) return transactionUpdate;
        if (table === recurringPayments) return recurringPaymentUpdate;
        throw new Error('Unexpected update table');
      }),
      delete: vi.fn((table: unknown) => {
        if (table === paymentMethods) return deleteChain;
        throw new Error('Unexpected delete table');
      }),
    };

    findMany.mockResolvedValue([{id: SOURCE_ID}, {id: TARGET_ID}]);
    transaction.mockImplementation(async (callback: (tx: TransactionClient) => Promise<unknown>) => callback(tx));
  });

  it('reassigns transactions by payment method id before deleting source methods', async () => {
    const response = await requestRouter(paymentMethodRouter, USER_ID, '/merge', {
      method: 'POST',
      body: {source: [SOURCE_ID], target: TARGET_ID},
    });

    expect(response.status).toBe(200);
  });

  it('builds the transaction merge predicate with payment_method_id', async () => {
    let transactionUpdate: ReturnType<typeof returningChain> | undefined;
    const tx = {
      update: vi.fn((table: unknown) => {
        const chain = returningChain([]);
        if (table === transactions) transactionUpdate = chain;
        return chain;
      }),
      delete: vi.fn(() => ({where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([])})),
    };
    transaction.mockImplementationOnce(async (callback: (tx: TransactionClient) => Promise<unknown>) => callback(tx));

    await requestRouter(paymentMethodRouter, USER_ID, '/merge', {
      method: 'POST',
      body: {source: [SOURCE_ID], target: TARGET_ID},
    });

    expect(transactionUpdate).toBeDefined();
    expect(transactionUpdate?.set).toHaveBeenCalledWith({paymentMethodId: TARGET_ID});
    const condition = transactionUpdate?.where.mock.calls[0][0];
    const query = new PgDialect().sqlToQuery(condition.getSQL()).sql;
    expect(query).toContain('payment_method_id');
    expect(query).not.toContain('category_id');
  });
});
