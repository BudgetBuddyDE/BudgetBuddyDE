import type {TRecurringPaymentOccurrence} from '@budgetbuddyde/api/recurringPayment';
import {describe, expect, it, vi} from 'vitest';
import {aggregateOccurrenceBuckets, loadAllOccurrences, occurrenceTotals} from './occurrenceChartData';
import type {OccurrenceRange} from './occurrenceRange';

const range: OccurrenceRange = {
  dateFrom: '2026-03-28',
  dateTo: '2026-03-31',
  includePaused: true,
  categories: [],
  paymentMethods: [],
};
const occurrence = (scheduledFor: string, transferAmount: number, id = 'schedule-1'): TRecurringPaymentOccurrence => ({
  scheduledFor,
  recurringPayment: {transferAmount, id} as TRecurringPaymentOccurrence['recurringPayment'],
});

describe('payment plan aggregation', () => {
  it('separates income and expenses, includes empty days and zero payments, and keeps dates across DST', () => {
    expect(
      aggregateOccurrenceBuckets(
        [
          occurrence('2026-03-28', -10.1),
          occurrence('2026-03-28', -0.2),
          occurrence('2026-03-29', 100),
          occurrence('2026-03-30', 0),
          occurrence('2026-04-01', -50),
        ],
        range,
        'day',
      ),
    ).toEqual([
      {dateFrom: '2026-03-28', dateTo: '2026-03-28', label: '2026-03-28', income: 0, expenses: 10.3, count: 2},
      {dateFrom: '2026-03-29', dateTo: '2026-03-29', label: '2026-03-29', income: 100, expenses: 0, count: 1},
      {dateFrom: '2026-03-30', dateTo: '2026-03-30', label: '2026-03-30', income: 0, expenses: 0, count: 1},
      {dateFrom: '2026-03-31', dateTo: '2026-03-31', label: '2026-03-31', income: 0, expenses: 0, count: 0},
    ]);
  });

  it('adds fractional-cent payments before rounding each bucket', () => {
    const data = [occurrence('2026-03-28', -0.015), occurrence('2026-03-28', -0.015)];
    expect(aggregateOccurrenceBuckets(data, range, 'day')[0].expenses).toBe(0.03);
    expect(occurrenceTotals(data, range).expenses).toBe(0.03);
  });

  it('rounds overall totals independently of rounded daily buckets', () => {
    const data = [occurrence('2026-03-28', -0.005), occurrence('2026-03-29', -0.005)];
    expect(
      aggregateOccurrenceBuckets(data, range, 'day')
        .slice(0, 2)
        .map(bucket => bucket.expenses),
    ).toEqual([0.01, 0.01]);
    expect(occurrenceTotals(data, range).expenses).toBe(0.01);
  });

  it('groups Monday-based calendar weeks with clipped first and last weeks', () => {
    expect(
      aggregateOccurrenceBuckets([occurrence('2026-03-29', -50), occurrence('2026-03-30', -20)], range, 'week'),
    ).toEqual([
      {dateFrom: '2026-03-28', dateTo: '2026-03-29', label: '2026-03-28', income: 0, expenses: 50, count: 1},
      {dateFrom: '2026-03-30', dateTo: '2026-03-31', label: '2026-03-30', income: 0, expenses: 20, count: 1},
    ]);
  });
});

describe('complete occurrence loading', () => {
  it('loads more than one page with the same paused, category and payment filters', async () => {
    const first = Array.from({length: 100}, (_, index) => occurrence('2026-03-28', -1, `schedule-${index}`));
    const get = vi
      .fn()
      .mockResolvedValueOnce([{data: first, totalCount: 101}, null])
      .mockResolvedValueOnce([{data: [occurrence('2026-03-29', 20)], totalCount: 101}, null]);
    const filtered = {...range, categories: ['category-1'], paymentMethods: ['payment-1']} as OccurrenceRange;
    const result = await loadAllOccurrences(filtered, get);
    expect(result).toHaveLength(101);
    expect(get).toHaveBeenLastCalledWith({
      $dateFrom: range.dateFrom,
      $dateTo: range.dateTo,
      $includePaused: true,
      $categories: ['category-1'],
      $paymentMethods: ['payment-1'],
      from: 100,
      to: 200,
    });
    expect(aggregateOccurrenceBuckets(result!, range, 'day')[0].expenses).toBe(100);
  });

  it('rejects later page failures rather than returning partial totals', async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce([
        {
          data: Array.from({length: 100}, (_, index) => occurrence('2026-03-28', -1, `schedule-${index}`)),
          totalCount: 101,
        },
        null,
      ])
      .mockResolvedValueOnce([null, {message: 'Second page failed'}]);
    await expect(loadAllOccurrences(range, get)).rejects.toThrow('Second page failed');
  });

  it('rejects missing pages and stops a stale request without requesting another page', async () => {
    const missing = vi.fn().mockResolvedValue([{data: [], totalCount: 10}, null]);
    await expect(loadAllOccurrences(range, missing)).rejects.toThrow('incomplete');
    let cancelled = false;
    const stale = vi.fn().mockImplementation(async () => {
      cancelled = true;
      return [{data: [occurrence('2026-03-28', 1)], totalCount: 101}, null];
    });
    expect(await loadAllOccurrences(range, stale, () => cancelled)).toBeNull();
    expect(stale).toHaveBeenCalledTimes(1);
  });
  it('rejects count changes between pages instead of accepting a mixed payment plan', async () => {
    const first = Array.from({length: 100}, (_, index) => occurrence('2026-03-28', -1, `schedule-${index}`));
    const get = vi
      .fn()
      .mockResolvedValueOnce([{data: first, totalCount: 101}, null])
      .mockResolvedValueOnce([{data: [], totalCount: 100}, null]);
    await expect(loadAllOccurrences(range, get)).rejects.toThrow('changed while loading');
  });

  it('rejects repeated occurrence keys across pages even when the total count stays unchanged', async () => {
    const first = Array.from({length: 100}, (_, index) => occurrence('2026-03-28', -1, `schedule-${index}`));
    const get = vi
      .fn()
      .mockResolvedValueOnce([{data: first, totalCount: 101}, null])
      .mockResolvedValueOnce([{data: [first[0]], totalCount: 101}, null]);
    await expect(loadAllOccurrences(range, get)).rejects.toThrow('changed while loading');
  });
});
