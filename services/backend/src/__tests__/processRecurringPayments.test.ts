import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const {findMany, createTransaction, info, error} = vi.hoisted(() => ({
  findMany: vi.fn(),
  createTransaction: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../db', () => ({
  db: {query: {recurringPayments: {findMany}}},
}));

vi.mock('../utils/createTransactionFromRecurringPayment', () => ({
  createTransactionFromRecurringPayment: createTransaction,
}));

vi.mock('../lib', () => ({logger: {info, error, debug: vi.fn()}}));

import {processRecurringPayments} from '../jobs/processRecurringPayments';

describe('processRecurringPayments', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T12:00:00.000Z'));
    vi.clearAllMocks();
    createTransaction.mockResolvedValue({id: 'transaction'});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes only plans occurring on today in the configured timezone', async () => {
    const daily = {id: 'daily', executionPlan: 'daily', startsOn: '2026-08-01'};
    const weeklyDue = {id: 'weekly-due', executionPlan: 'weekly', startsOn: '2026-08-21'};
    const weeklyNotDue = {id: 'weekly-not-due', executionPlan: 'weekly', startsOn: '2026-08-22'};
    findMany.mockResolvedValue([daily, weeklyDue, weeklyNotDue]);

    await processRecurringPayments();

    expect(createTransaction).toHaveBeenCalledTimes(2);
    expect(createTransaction.mock.calls.map(([payment]) => payment.id)).toEqual(['daily', 'weekly-due']);
    expect(info).toHaveBeenCalledWith(expect.stringContaining('2026-08-28'), {scheduledFor: '2026-08-28'});
  });

  it('does not create a catch-up transaction when no candidate is due', async () => {
    findMany.mockResolvedValue([{id: 'weekly', executionPlan: 'weekly', startsOn: '2026-08-27'}]);

    await processRecurringPayments();

    expect(createTransaction).not.toHaveBeenCalled();
  });
});
