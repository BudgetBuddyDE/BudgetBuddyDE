import {describe, expect, it} from 'vitest';
import {RecurringPaymentService} from './recurringPayment.service';

const service = new RecurringPaymentService('http://localhost');

describe('determineNextExecutionDate', () => {
  it('advances quarterly schedules from their creation-month anchor', () => {
    const result = service.determineNextExecutionDate(15, 'quarterly', new Date(2026, 0, 10), new Date(2026, 1, 20));
    expect(result).toEqual(new Date(2026, 3, 15));
  });

  it('uses the final calendar day when the configured day does not exist', () => {
    const result = service.determineNextExecutionDate(31, 'monthly', new Date(2026, 0, 1), new Date(2026, 1, 1));
    expect(result).toEqual(new Date(2026, 1, 28));
  });

  it('moves yearly schedules to the next anchored year after their due date', () => {
    const result = service.determineNextExecutionDate(10, 'yearly', new Date(2025, 6, 1), new Date(2026, 6, 11));
    expect(result).toEqual(new Date(2027, 6, 10));
  });
});
