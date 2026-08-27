import {describe, expect, it} from 'vitest';
import {
  getRecurringPaymentStatusQuickFilter,
  getTransactionDateQuickFilterRange,
  isTransactionDateQuickFilterActive,
} from './quickFilters';

describe('quickFilters', () => {
  const referenceDate = new Date('2024-06-15T12:00:00.000Z');

  it('builds the today transaction date range', () => {
    expect(getTransactionDateQuickFilterRange('today', referenceDate)).toEqual({
      dateFrom: referenceDate,
      dateTo: referenceDate,
    });
  });

  it('builds this month transaction date range', () => {
    const result = getTransactionDateQuickFilterRange('thisMonth', referenceDate);
    expect(result.dateFrom).toEqual(new Date(2024, 5, 1, 0, 0, 0, 0));
    expect(result.dateTo).toEqual(new Date(2024, 5, 30, 23, 59, 59, 999));
  });

  it('builds last month transaction date range', () => {
    const result = getTransactionDateQuickFilterRange('lastMonth', referenceDate);
    expect(result.dateFrom).toEqual(new Date(2024, 4, 1, 0, 0, 0, 0));
    expect(result.dateTo).toEqual(new Date(2024, 4, 31, 23, 59, 59, 999));
  });

  it('maps recurring payment status quick filters to paused filters', () => {
    expect(getRecurringPaymentStatusQuickFilter('active')).toEqual({paused: false});
    expect(getRecurringPaymentStatusQuickFilter('inactive')).toEqual({paused: true});
  });

  it('recognizes an active transaction date quick filter regardless of its time', () => {
    expect(
      isTransactionDateQuickFilterActive(
        'thisMonth',
        {
          dateFrom: new Date('2024-06-01T00:00:00.000Z'),
          dateTo: new Date('2024-06-30T00:00:00.000Z'),
        },
        referenceDate,
      ),
    ).toBe(true);
  });

  it('does not mark a different transaction date range as active', () => {
    expect(
      isTransactionDateQuickFilterActive(
        'thisMonth',
        {
          dateFrom: new Date('2024-06-02T00:00:00.000Z'),
          dateTo: new Date('2024-06-30T00:00:00.000Z'),
        },
        referenceDate,
      ),
    ).toBe(false);
  });
});
