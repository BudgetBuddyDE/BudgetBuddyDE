import type {EntityFilters} from '@/lib/features/createEntitySlice';
import {Formatter} from '@/utils/Formatter';

export type EntityUrlState = {filters: Partial<EntityFilters>; page: number; pageSize: number};

const PAGE_PARAM = 'page';
const PAGE_SIZE_PARAM = 'pageSize';
const ENTITY_PAGE_SIZES = [15, 25, 50, 100];

function parsePageState(
  params: Record<string, string | string[] | undefined>,
): Pick<EntityUrlState, 'page' | 'pageSize'> {
  const pageValue = params[PAGE_PARAM];
  const pageSizeValue = params[PAGE_SIZE_PARAM];
  const page = typeof pageValue === 'string' ? Number(pageValue) : NaN;
  const pageSize = typeof pageSizeValue === 'string' ? Number(pageSizeValue) : NaN;
  return {
    page: Number.isSafeInteger(page) && page > 0 ? page - 1 : 0,
    pageSize: ENTITY_PAGE_SIZES.includes(pageSize) ? pageSize : 15,
  };
}

function toSearchRecord(params: URLSearchParams): Record<string, string | string[] | undefined> {
  const record: Record<string, string | string[] | undefined> = {};
  for (const key of Array.from(new Set(params.keys()))) {
    const values = params.getAll(key);
    record[key] = values.length > 1 ? values : values[0];
  }
  return record;
}

function serializePageState(state: EntityUrlState, params: URLSearchParams) {
  if (state.page > 0) params.set(PAGE_PARAM, String(state.page + 1));
  if (state.pageSize !== 15) params.set(PAGE_SIZE_PARAM, String(state.pageSize));
}

export function parseTransactionQuery(params: URLSearchParams): EntityUrlState {
  return {
    filters: parseTransactionFiltersFromParams(toSearchRecord(params)),
    ...parsePageState(toSearchRecord(params)),
  };
}

export function parseRecurringPaymentQuery(params: URLSearchParams): EntityUrlState {
  return {
    filters: parseRecurringPaymentFiltersFromParams(toSearchRecord(params)),
    ...parsePageState(toSearchRecord(params)),
  };
}

export function parseKeywordQuery(params: URLSearchParams): EntityUrlState {
  return {filters: parseKeywordFilterFromParams(toSearchRecord(params)), ...parsePageState(toSearchRecord(params))};
}

export function serializeTransactionQuery(state: EntityUrlState, params = new URLSearchParams()): URLSearchParams {
  const filters = serializeTransactionFilters(state.filters as EntityFilters);
  filters.forEach((value, key) => params.set(key, value));
  serializePageState(state, params);
  return params;
}

export function serializeRecurringPaymentQuery(state: EntityUrlState, params = new URLSearchParams()): URLSearchParams {
  const filters = serializeRecurringPaymentFilters(state.filters as EntityFilters);
  filters.forEach((value, key) => params.set(key, value));
  serializePageState(state, params);
  return params;
}

export function serializeKeywordQuery(state: EntityUrlState, params = new URLSearchParams()): URLSearchParams {
  const filters = serializeKeywordFilter(state.filters as EntityFilters);
  filters.forEach((value, key) => params.set(key, value));
  serializePageState(state, params);
  return params;
}

export function parsePaginationQuery(params: URLSearchParams, defaultPageSize = 15): EntityUrlState {
  const record = toSearchRecord(params);
  const pageState = parsePageState(record);
  return {
    ...pageState,
    pageSize: record[PAGE_SIZE_PARAM] === undefined ? defaultPageSize : pageState.pageSize,
    filters: {},
  };
}

export function serializePaginationQuery(state: EntityUrlState, params = new URLSearchParams()): URLSearchParams {
  if (state.page > 0) params.set(PAGE_PARAM, String(state.page + 1));
  if (state.pageSize === 15) params.delete(PAGE_SIZE_PARAM);
  else params.set(PAGE_SIZE_PARAM, String(state.pageSize));
  return params;
}

export function updateManagedSearchParams(
  current: URLSearchParams,
  managedKeys: readonly string[],
  next: URLSearchParams,
): URLSearchParams {
  const updated = new URLSearchParams(current);
  managedKeys.forEach(key => updated.delete(key));
  next.forEach((value, key) => updated.append(key, value));
  return updated;
}

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
  return Array.from(
    new Set(
      value
        .split(',')
        .map(id => id.trim())
        .filter(Boolean),
    ),
  );
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
  if (typeof dateFrom === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
    const d = new Date(dateFrom);
    if (!Number.isNaN(d.getTime()) && d.toISOString().startsWith(dateFrom)) filters.dateFrom = d;
  }

  const dateTo = params[PARAM.dateTo];
  if (typeof dateTo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    const d = new Date(dateTo);
    if (!Number.isNaN(d.getTime()) && d.toISOString().startsWith(dateTo)) filters.dateTo = d;
  }

  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    delete filters.dateFrom;
    delete filters.dateTo;
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
