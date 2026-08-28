import type {TCategory} from '@budgetbuddyde/api/category';
import type {TPaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import {endOfLocalMonthDateOnly, formatLocalDateOnly, parseLocalDateOnly} from '../dateOnly';

export type OccurrenceRange = {
  dateFrom: string;
  dateTo: string;
  includePaused: boolean;
  categories: TCategory['id'][];
  paymentMethods: TPaymentMethod['id'][];
};

function readDateOnly(value: string | string[] | undefined): string | null {
  if (typeof value !== 'string') return null;
  try {
    parseLocalDateOnly(value);
    return value;
  } catch {
    return null;
  }
}

function readIds<T extends string>(value: string | string[] | undefined): T[] {
  if (typeof value !== 'string') return [];
  return value.split(',').filter(Boolean) as T[];
}

export function parseOccurrenceRangeParams(
  params: Record<string, string | string[] | undefined>,
  today: Date = new Date(),
): OccurrenceRange {
  const defaultFrom = formatLocalDateOnly(today);
  const dateFrom = readDateOnly(params.dateFrom) ?? defaultFrom;
  const dateTo = readDateOnly(params.dateTo) ?? endOfLocalMonthDateOnly(today);

  return {
    dateFrom,
    dateTo: dateTo < dateFrom ? dateFrom : dateTo,
    includePaused: params.includePaused === 'true',
    categories: readIds<TCategory['id']>(params.cat),
    paymentMethods: readIds<TPaymentMethod['id']>(params.pm),
  };
}
