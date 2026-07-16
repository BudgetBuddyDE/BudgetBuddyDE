import {describe, expect, it} from 'vitest';
import {isRecurringPaymentDue} from './isRecurringPaymentDue';

const createdAt = new Date(2026, 0, 15);

describe('isRecurringPaymentDue', () => {
  it('keeps monthly payments due every month after creation', () => {
    expect(isRecurringPaymentDue({interval: 'monthly', createdAt}, new Date(2026, 1, 15))).toBe(true);
  });

  it('runs quarterly payments only every third anchored month', () => {
    expect(isRecurringPaymentDue({interval: 'quarterly', createdAt}, new Date(2026, 2, 15))).toBe(false);
    expect(isRecurringPaymentDue({interval: 'quarterly', createdAt}, new Date(2026, 3, 15))).toBe(true);
  });

  it('runs yearly payments only in their creation month', () => {
    expect(isRecurringPaymentDue({interval: 'yearly', createdAt}, new Date(2026, 11, 15))).toBe(false);
    expect(isRecurringPaymentDue({interval: 'yearly', createdAt}, new Date(2027, 0, 15))).toBe(true);
  });

  it('never treats a pre-creation period as due', () => {
    expect(isRecurringPaymentDue({interval: 'monthly', createdAt}, new Date(2025, 11, 15))).toBe(false);
  });
});
