import {endOfMonth, endOfWeek, startOfMonth, startOfWeek, subMonths} from 'date-fns';
import type {EntityFilters} from '@/lib/features/createEntitySlice';

export type TransactionDateQuickFilter = 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth';
export type RecurringPaymentStatusQuickFilter = 'active' | 'inactive';
export type RecurringPaymentExecutionQuickFilter = 'executed' | 'scheduled';

export function getTransactionDateQuickFilterRange(
  filter: TransactionDateQuickFilter,
  referenceDate: Date = new Date(),
): Pick<EntityFilters, 'dateFrom' | 'dateTo'> {
  switch (filter) {
    case 'today':
      return {dateFrom: referenceDate, dateTo: referenceDate};
    case 'thisWeek':
      return {
        dateFrom: startOfWeek(referenceDate, {weekStartsOn: 1}),
        dateTo: endOfWeek(referenceDate, {weekStartsOn: 1}),
      };
    case 'thisMonth':
      return {dateFrom: startOfMonth(referenceDate), dateTo: endOfMonth(referenceDate)};
    case 'lastMonth': {
      const lastMonth = subMonths(referenceDate, 1);
      return {dateFrom: startOfMonth(lastMonth), dateTo: endOfMonth(lastMonth)};
    }
  }
}

export function getRecurringPaymentStatusQuickFilter(
  filter: RecurringPaymentStatusQuickFilter,
): Pick<EntityFilters, 'paused'> {
  return {paused: filter === 'inactive'};
}

export function getRecurringPaymentExecutionQuickFilter(
  filter: RecurringPaymentExecutionQuickFilter,
  referenceDate: Date = new Date(),
): Pick<EntityFilters, 'executeFrom' | 'executeTo'> {
  const today = referenceDate.getDate();
  if (filter === 'executed') {
    return {executeFrom: 1, executeTo: Math.max(1, today - 1)};
  }
  return {executeFrom: today, executeTo: endOfMonth(referenceDate).getDate()};
}

function isSameCalendarDate(left: Date | null | undefined, right: Date | null | undefined): boolean {
  if (!left || !right) return left === right;
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function isTransactionDateQuickFilterActive(
  filter: TransactionDateQuickFilter,
  currentFilters: Partial<EntityFilters>,
  referenceDate: Date = new Date(),
): boolean {
  const quickFilterRange = getTransactionDateQuickFilterRange(filter, referenceDate);
  return (
    isSameCalendarDate(currentFilters.dateFrom, quickFilterRange.dateFrom) &&
    isSameCalendarDate(currentFilters.dateTo, quickFilterRange.dateTo)
  );
}

export function isRecurringPaymentExecutionQuickFilterActive(
  filter: RecurringPaymentExecutionQuickFilter,
  currentFilters: Partial<EntityFilters>,
  referenceDate: Date = new Date(),
): boolean {
  const quickFilterRange = getRecurringPaymentExecutionQuickFilter(filter, referenceDate);
  return (
    currentFilters.executeFrom === quickFilterRange.executeFrom &&
    currentFilters.executeTo === quickFilterRange.executeTo
  );
}
