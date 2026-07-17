import {addMonths, addYears} from 'date-fns';

export type RecurringInterval = 'monthly' | 'quarterly' | 'yearly';

export function advanceRecurringDate(value: Date, interval: RecurringInterval): Date {
  if (interval === 'yearly') return addYears(value, 1);
  return addMonths(value, interval === 'quarterly' ? 3 : 1);
}

export function nextRecurringDateAfter(value: Date, interval: RecurringInterval, after: Date): Date {
  let next = value;
  do {
    next = advanceRecurringDate(next, interval);
  } while (next <= after);
  return next;
}
