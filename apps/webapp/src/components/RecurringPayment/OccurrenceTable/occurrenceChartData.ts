import type {TRecurringPaymentOccurrence} from '@budgetbuddyde/api/recurringPayment';
import type {apiClient} from '@/apiClient';
import {formatLocalDateOnly, parseLocalDateOnly} from '../dateOnly';
import type {OccurrenceRange} from './occurrenceRange';

export type OccurrenceBucket = {
  dateFrom: string;
  dateTo: string;
  label: string;
  income: number;
  expenses: number;
  count: number;
};

export function occurrenceQuery(range: OccurrenceRange) {
  return {
    $dateFrom: range.dateFrom,
    $dateTo: range.dateTo,
    $includePaused: range.includePaused || undefined,
    $categories: range.categories.length ? range.categories : undefined,
    $paymentMethods: range.paymentMethods.length ? range.paymentMethods : undefined,
  };
}

/** Fetch a complete plan independently of table pagination, or fail without publishing partial totals. */
export async function loadAllOccurrences(
  range: OccurrenceRange,
  getOccurrences: typeof apiClient.backend.recurringPayment.getOccurrences,
  isCancelled: () => boolean = () => false,
): Promise<TRecurringPaymentOccurrence[] | null> {
  const occurrences: TRecurringPaymentOccurrence[] = [];
  let totalCount: number | undefined;
  const occurrenceKeys = new Set<string>();
  do {
    if (isCancelled()) return null;
    const [response, error] = await getOccurrences({
      ...occurrenceQuery(range),
      from: occurrences.length,
      to: occurrences.length + 100,
    });
    if (isCancelled()) return null;
    if (error) throw new Error(error.message);
    if (!response?.data || typeof response.totalCount !== 'number') {
      throw new Error('No complete payment plan received. Please retry.');
    }
    if (totalCount !== undefined && response.totalCount !== totalCount) {
      throw new Error('The payment plan changed while loading. Please retry.');
    }
    totalCount ??= response.totalCount;
    if (!response.data.length && occurrences.length < totalCount) {
      throw new Error('The payment plan is incomplete. Please retry.');
    }
    for (const occurrence of response.data) {
      const key = `${occurrence.recurringPayment.id}:${occurrence.scheduledFor}`;
      if (occurrenceKeys.has(key)) {
        throw new Error('The payment plan changed while loading. Please retry.');
      }
      occurrenceKeys.add(key);
      occurrences.push(occurrence);
    }
    if (occurrences.length > totalCount) {
      throw new Error('The payment plan changed while loading. Please retry.');
    }
  } while (occurrences.length < totalCount);
  return occurrences;
}

/** Calendar arithmetic uses local date-only values; no UTC conversions may shift scheduled dates. */
export function aggregateOccurrenceBuckets(
  occurrences: TRecurringPaymentOccurrence[],
  range: Pick<OccurrenceRange, 'dateFrom' | 'dateTo'>,
  grouping: 'day' | 'week',
): OccurrenceBucket[] {
  const buckets: OccurrenceBucket[] = [];
  const lookup = new Map<string, OccurrenceBucket>();
  const cursor = parseLocalDateOnly(range.dateFrom);
  let current: OccurrenceBucket | undefined;
  while (formatLocalDateOnly(cursor) <= range.dateTo) {
    const day = formatLocalDateOnly(cursor);
    if (!current || grouping === 'day' || cursor.getDay() === 1) {
      current = {dateFrom: day, dateTo: day, label: day, income: 0, expenses: 0, count: 0};
      buckets.push(current);
    }
    current.dateTo = day;
    lookup.set(day, current);
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const occurrence of occurrences) {
    const bucket = lookup.get(occurrence.scheduledFor);
    if (!bucket) continue;
    const amount = occurrence.recurringPayment.transferAmount;
    if (!Number.isFinite(amount)) continue;
    if (amount < 0) bucket.expenses += Math.abs(amount);
    else bucket.income += amount;
    bucket.count += 1;
  }
  return buckets.map(bucket => ({
    ...bucket,
    income: roundAmount(bucket.income),
    expenses: roundAmount(bucket.expenses),
  }));
}

function roundAmount(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Round complete period totals once, independently of rounded chart buckets. */
export function occurrenceTotals(
  occurrences: TRecurringPaymentOccurrence[],
  range: Pick<OccurrenceRange, 'dateFrom' | 'dateTo'>,
): {income: number; expenses: number} {
  let income = 0;
  let expenses = 0;
  for (const {scheduledFor, recurringPayment} of occurrences) {
    const amount = recurringPayment.transferAmount;
    if (scheduledFor < range.dateFrom || scheduledFor > range.dateTo || !Number.isFinite(amount)) continue;
    if (amount < 0) expenses += Math.abs(amount);
    else income += amount;
  }
  return {income: roundAmount(income), expenses: roundAmount(expenses)};
}
