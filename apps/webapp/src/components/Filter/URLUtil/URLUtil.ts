import type {EntityFilters} from '@/lib/features/createEntitySlice';

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
  executeFrom: 'execFrom',
  executeTo: 'execTo',
} as const;

/**
 * Parse comma-separated IDs from a URL param value
 */
function parseIds(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

/**
 * Serialize transaction-style filters from plain URL search params object
 */
export function parseTransactionFiltersFromParams(
  params: Record<string, string | string[] | undefined>,
): Partial<EntityFilters> {
  const filters: Partial<EntityFilters> = {};

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

  const cat = params[PARAM.categories];
  const catIds = parseIds(Array.isArray(cat) ? cat.join(',') : (cat ?? ''));
  if (catIds.length) filters.categories = catIds;

  const exclCat = params[PARAM.excl_categories];
  const exclCatIds = parseIds(Array.isArray(exclCat) ? exclCat.join(',') : (exclCat ?? ''));
  if (exclCatIds.length) filters.excl_categories = exclCatIds;

  const pm = params[PARAM.paymentMethods];
  const pmIds = parseIds(Array.isArray(pm) ? pm.join(',') : (pm ?? ''));
  if (pmIds.length) filters.paymentMethods = pmIds;

  const exclPm = params[PARAM.excl_paymentMethods];
  const exclPmIds = parseIds(Array.isArray(exclPm) ? exclPm.join(',') : (exclPm ?? ''));
  if (exclPmIds.length) filters.excl_paymentMethods = exclPmIds;

  return filters;
}

/**
 * Parse recurring-payment-style filters from plain URL search params object
 */
export function parseRecurringPaymentFiltersFromParams(
  params: Record<string, string | string[] | undefined>,
): Partial<EntityFilters> {
  const filters: Partial<EntityFilters> = {};

  const q = params[PARAM.keyword];
  if (typeof q === 'string' && q) filters.keyword = q;

  const execFrom = params[PARAM.executeFrom];
  if (typeof execFrom === 'string' && execFrom) {
    const n = parseInt(execFrom, 10);
    if (!Number.isNaN(n)) filters.executeFrom = n;
  }

  const execTo = params[PARAM.executeTo];
  if (typeof execTo === 'string' && execTo) {
    const n = parseInt(execTo, 10);
    if (!Number.isNaN(n)) filters.executeTo = n;
  }

  const cat = params[PARAM.categories];
  const catIds = parseIds(Array.isArray(cat) ? cat.join(',') : (cat ?? ''));
  if (catIds.length) filters.categories = catIds;

  const exclCat = params[PARAM.excl_categories];
  const exclCatIds = parseIds(Array.isArray(exclCat) ? exclCat.join(',') : (exclCat ?? ''));
  if (exclCatIds.length) filters.excl_categories = exclCatIds;

  const pm = params[PARAM.paymentMethods];
  const pmIds = parseIds(Array.isArray(pm) ? pm.join(',') : (pm ?? ''));
  if (pmIds.length) filters.paymentMethods = pmIds;

  const exclPm = params[PARAM.excl_paymentMethods];
  const exclPmIds = parseIds(Array.isArray(exclPm) ? exclPm.join(',') : (exclPm ?? ''));
  if (exclPmIds.length) filters.excl_paymentMethods = exclPmIds;

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
  const p = new URLSearchParams();
  if (filters.keyword) p.set(PARAM.keyword, filters.keyword);
  if (filters.dateFrom) p.set(PARAM.dateFrom, filters.dateFrom.toISOString());
  if (filters.dateTo) p.set(PARAM.dateTo, filters.dateTo.toISOString());
  if (filters.categories?.length) p.set(PARAM.categories, filters.categories.join(','));
  if (filters.excl_categories?.length) p.set(PARAM.excl_categories, filters.excl_categories.join(','));
  if (filters.paymentMethods?.length) p.set(PARAM.paymentMethods, filters.paymentMethods.join(','));
  if (filters.excl_paymentMethods?.length) p.set(PARAM.excl_paymentMethods, filters.excl_paymentMethods.join(','));
  return p;
}

/**
 * Serialize EntityFilters to URLSearchParams for recurring payment pages
 */
export function serializeRecurringPaymentFilters(filters: EntityFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.keyword) p.set(PARAM.keyword, filters.keyword);
  if (filters.executeFrom != null) p.set(PARAM.executeFrom, String(filters.executeFrom));
  if (filters.executeTo != null) p.set(PARAM.executeTo, String(filters.executeTo));
  if (filters.categories?.length) p.set(PARAM.categories, filters.categories.join(','));
  if (filters.excl_categories?.length) p.set(PARAM.excl_categories, filters.excl_categories.join(','));
  if (filters.paymentMethods?.length) p.set(PARAM.paymentMethods, filters.paymentMethods.join(','));
  if (filters.excl_paymentMethods?.length) p.set(PARAM.excl_paymentMethods, filters.excl_paymentMethods.join(','));
  return p;
}

/**
 * Serialize keyword-only filter to URLSearchParams
 */
export function serializeKeywordFilter(filters: EntityFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.keyword) p.set(PARAM.keyword, filters.keyword);
  return p;
}
