import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const {findMany, createTransaction, info, error, invalidateUserCaches} = vi.hoisted(() => ({
  findMany: vi.fn(),
  createTransaction: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  invalidateUserCaches: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../db', () => ({
  db: {query: {recurringPayments: {findMany}}},
}));

vi.mock('../utils/createTransactionFromRecurringPayment', () => ({
  createTransactionFromRecurringPayment: createTransaction,
}));

vi.mock('../lib', () => ({logger: {info, error, debug: vi.fn()}}));
vi.mock('../middleware/cache.middleware', () => ({invalidateUserCaches}));

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
    const daily = {id: 'daily', ownerId: 'user-1', executionPlan: 'daily', startsOn: '2026-08-01'};
    const weeklyDue = {id: 'weekly-due', ownerId: 'user-1', executionPlan: 'weekly', startsOn: '2026-08-21'};
    const weeklyNotDue = {id: 'weekly-not-due', ownerId: 'user-1', executionPlan: 'weekly', startsOn: '2026-08-22'};
    findMany.mockResolvedValue([daily, weeklyDue, weeklyNotDue]);

    await processRecurringPayments();

    expect(createTransaction).toHaveBeenCalledTimes(2);
    expect(createTransaction.mock.calls.map(([payment]) => payment.id)).toEqual(['daily', 'weekly-due']);
    expect(info).toHaveBeenCalledWith(expect.stringContaining('2026-08-28'), {scheduledFor: '2026-08-28'});
  });

  it('does not create a catch-up transaction when no candidate is due', async () => {
    findMany.mockResolvedValue([{id: 'weekly', ownerId: 'user-1', executionPlan: 'weekly', startsOn: '2026-08-27'}]);

    await processRecurringPayments();

    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('invalidates affected owner caches after successful processing', async () => {
    findMany.mockResolvedValueOnce([
      {id: 'daily-a', ownerId: 'user-a', executionPlan: 'daily', startsOn: '2026-08-01'},
      {id: 'daily-b', ownerId: 'user-a', executionPlan: 'daily', startsOn: '2026-08-01'},
      {id: 'daily-c', ownerId: 'user-b', executionPlan: 'daily', startsOn: '2026-08-01'},
    ]);

    await processRecurringPayments();

    expect(invalidateUserCaches).toHaveBeenCalledTimes(2);
    expect(invalidateUserCaches).toHaveBeenCalledWith('user-a', ['/api/transaction', '/api/budget', '/api/insights']);
    expect(invalidateUserCaches).toHaveBeenCalledWith('user-b', ['/api/transaction', '/api/budget', '/api/insights']);
  });

  it('logs candidate query failures without rejecting the job', async () => {
    const databaseError = new Error('database unavailable');
    findMany.mockRejectedValueOnce(databaseError);

    await expect(processRecurringPayments()).resolves.toBeUndefined();

    expect(createTransaction).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('Error processing recurring payments:', databaseError);
  });

  it('limits concurrent recurring payment processing to one batch', async () => {
    const payments = Array.from({length: 25}, (_, index) => ({
      id: `daily-${index}`,
      executionPlan: 'daily',
      startsOn: '2026-08-01',
    }));
    let active = 0;
    let maximumActive = 0;
    findMany.mockResolvedValueOnce(payments);
    createTransaction.mockImplementation(async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await Promise.resolve();
      active -= 1;
      return {id: 'transaction'};
    });

    await processRecurringPayments();

    expect(maximumActive).toBe(10);
    expect(createTransaction).toHaveBeenCalledTimes(25);
  });

  it('continues with later payments when one payment fails', async () => {
    const payments = Array.from({length: 11}, (_, index) => ({
      id: `daily-${index}`,
      executionPlan: 'daily',
      startsOn: '2026-08-01',
    }));
    findMany.mockResolvedValueOnce(payments);
    createTransaction.mockRejectedValueOnce(new Error('insert failed'));

    await processRecurringPayments();

    expect(createTransaction).toHaveBeenCalledTimes(11);
    expect(error).toHaveBeenCalledWith(
      'Failed to process recurring payment',
      expect.any(Error),
      expect.objectContaining({recurringPaymentId: 'daily-0', scheduledFor: '2026-08-28'}),
    );
  });
});
