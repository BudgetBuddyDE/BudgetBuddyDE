import type {EntityFilters} from '@/lib/features/createEntitySlice';
import {Formatter} from '@/utils/Formatter';

/**
 * URL parameter key names
 */
const PARAM = {
  keyword: 'q',
  dateFrom: 'dateFrom',
  dateTo: 'dateTo',
  categories: 'cat',
  excl_categories: 'excl_cat',
  paymentMethods: 'pm',
  excl_paymentMethods: 'excl_pm',
  paused: 'paused',
} as const;

/** ID-list filter fields shared by every entity page, in serialization order. */
const ID_FILTER_PARAMS = [
  [PARAM.categories, 'categories'],
  [PARAM.excl_categories, 'excl_categories'],
  [PARAM.paymentMethods, 'paymentMethods'],
  [PARAM.excl_paymentMethods, 'excl_paymentMethods'],
] as const satisfies ReadonlyArray<readonly [string, keyof EntityFilters]>;

/**
 * Parse comma-separated IDs from a URL param value
 */
function parseIds(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

function paramToString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value.join(',') : (value ?? '');
}

function parseIdFilters(
  params: Record<string, string | string[] | undefined>,
  filters: Partial<EntityFilters>,
): Partial<EntityFilters> {
  for (const [param, key] of ID_FILTER_PARAMS) {
    const ids = parseIds(paramToString(params[param]));
    if (ids.length) filters[key] = ids;
  }
  return filters;
}

function serializeIdFilters(filters: EntityFilters, params: URLSearchParams): URLSearchParams {
  for (const [param, key] of ID_FILTER_PARAMS) {
    const value = filters[key];
    if (value?.length) params.set(param, value.join(','));
  }
  return params;
}

/**
 * Parse transaction-style filters from plain URL search params object
 */
export function parseTransactionFiltersFromParams(
  params: Record<string, string | string[] | undefined>,
): Partial<EntityFilters> {
  const filters = parseIdFilters(params, {});

  const q = params[PARAM.keyword];
  if (typeof q === 'string' && q) filters.keyword = q;

  const dateFrom = params[PARAM.dateFrom];
  if (typeof dateFrom === 'string' && dateFrom) {
    const d = new Date(dateFrom);
    if (!Number.isNaN(d.getTime())) filters.dateFrom = d;
  }

  const dateTo = params[PARAM.dateTo];
  if (typeof dateTo === 'string' && dateTo) {
    const d = new Date(dateTo);
    if (!Number.isNaN(d.getTime())) filters.dateTo = d;
  }

  return filters;
}

/**
 * Parse recurring-payment-style filters from plain URL search params object
 */
export function parseRecurringPaymentFiltersFromParams(
  params: Record<string, string | string[] | undefined>,
): Partial<EntityFilters> {
  const filters = parseIdFilters(params, {});

  const q = params[PARAM.keyword];
  if (typeof q === 'string' && q) filters.keyword = q;

  const paused = params[PARAM.paused];
  if (typeof paused === 'string' && paused) filters.paused = paused === 'true';

  return filters;
}

/**
 * Parse keyword-only filters (for category / payment method tables)
 */
export function parseKeywordFilterFromParams(
  params: Record<string, string | string[] | undefined>,
): Partial<EntityFilters> {
  const q = params[PARAM.keyword];
  if (typeof q === 'string' && q) return {keyword: q};
  return {};
}

/**
 * Serialize EntityFilters to URLSearchParams for transaction pages
 */
export function serializeTransactionFilters(filters: EntityFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.keyword) params.set(PARAM.keyword, filters.keyword);
  if (filters.dateFrom) params.set(PARAM.dateFrom, Formatter.date.formatWithPattern(filters.dateFrom, 'yyyy-MM-dd'));
  if (filters.dateTo) params.set(PARAM.dateTo, Formatter.date.formatWithPattern(filters.dateTo, 'yyyy-MM-dd'));
  return serializeIdFilters(filters, params);
}

/**
 * Serialize EntityFilters to URLSearchParams for recurring payment pages
 */
export function serializeRecurringPaymentFilters(filters: EntityFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.keyword) params.set(PARAM.keyword, filters.keyword);
  if (filters.paused != null) params.set(PARAM.paused, String(filters.paused));
  return serializeIdFilters(filters, params);
}

/**
 * Serialize keyword-only filter to URLSearchParams
 */
export function serializeKeywordFilter(filters: EntityFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.keyword) params.set(PARAM.keyword, filters.keyword);
  return params;
}
