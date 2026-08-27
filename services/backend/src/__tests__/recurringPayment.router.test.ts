import {describe, expect, it} from 'vitest';
import {
  expandRecurringPaymentOccurrences,
  recurringPaymentOccurrencesQuerySchema,
} from '../router/recurringPayment.router';

describe('recurring payment occurrence query validation', () => {
  it('accepts an inclusive 366-day range and parses pagination and paused inclusion', () => {
    expect(
      recurringPaymentOccurrencesQuerySchema.parse({
        $dateFrom: '2024-01-01',
        $dateTo: '2024-12-31',
        from: '2',
        to: '5',
        $includePaused: 'true',
      }),
    ).toMatchObject({from: 2, to: 5, $includePaused: true});
  });

  it.each([
    {$dateFrom: '2026-02-30', $dateTo: '2026-03-01'},
    {$dateFrom: '2026-08-29T00:00:00.000Z', $dateTo: '2026-08-30'},
    {$dateFrom: '2026-08-30', $dateTo: '2026-08-29'},
    {$dateFrom: '2024-01-01', $dateTo: '2025-01-01'},
    {$dateFrom: '2026-08-01', $dateTo: '2026-08-31', from: '-1'},
    {$dateFrom: '2026-08-01', $dateTo: '2026-08-31', from: '3', to: '2'},
    {$dateFrom: '2026-08-01', $dateTo: '2026-08-31', from: '0', to: '101'},
  ])('rejects invalid date ranges or pagination: %o', query => {
    expect(recurringPaymentOccurrencesQuerySchema.safeParse(query).success).toBe(false);
  });

  it('defaults paused inclusion to false', () => {
    expect(
      recurringPaymentOccurrencesQuerySchema.parse({$dateFrom: '2026-08-01', $dateTo: '2026-08-01'}),
    ).toMatchObject({$includePaused: false});
  });
});

describe('recurring payment occurrence expansion', () => {
  it('flattens repeated daily and weekly rows and orders equal dates by payment id', () => {
    const occurrences = expandRecurringPaymentOccurrences(
      [
        {id: 'weekly', executionPlan: 'weekly', startsOn: '2026-08-01'},
        {id: 'daily', executionPlan: 'daily', startsOn: '2026-08-07'},
      ],
      '2026-08-07',
      '2026-08-08',
    );

    expect(occurrences.map(({scheduledFor, recurringPayment}) => `${scheduledFor}:${recurringPayment.id}`)).toEqual([
      '2026-08-07:daily',
      '2026-08-08:daily',
      '2026-08-08:weekly',
    ]);
  });
});
