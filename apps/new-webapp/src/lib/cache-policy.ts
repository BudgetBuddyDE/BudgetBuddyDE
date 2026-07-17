export type DataResource =
  | 'session'
  | 'transactions'
  | 'categories'
  | 'payment-methods'
  | 'recurring-payments'
  | 'budgets'
  | 'attachments'
  | 'analytics'
  | 'reports'
  | 'api-keys';

export interface CacheDimensions {
  resource: DataResource;
  userId: string;
  householdId?: string;
  from?: string | number;
  to?: string | number;
  filters?: Record<string, boolean | number | string | string[] | undefined>;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CachePolicy {
  freshnessSeconds: number;
  privacy: 'private-user' | 'private-session';
  staleBehavior: 'show-stale-with-warning' | 'block';
  invalidatedBy: DataResource[];
}

export const cachePolicies: Record<DataResource, CachePolicy> = {
  session: {freshnessSeconds: 0, privacy: 'private-session', staleBehavior: 'block', invalidatedBy: ['session']},
  transactions: {
    freshnessSeconds: 0,
    privacy: 'private-user',
    staleBehavior: 'show-stale-with-warning',
    invalidatedBy: ['transactions', 'categories', 'payment-methods'],
  },
  categories: {
    freshnessSeconds: 60,
    privacy: 'private-user',
    staleBehavior: 'show-stale-with-warning',
    invalidatedBy: ['categories'],
  },
  'payment-methods': {
    freshnessSeconds: 60,
    privacy: 'private-user',
    staleBehavior: 'show-stale-with-warning',
    invalidatedBy: ['payment-methods'],
  },
  'recurring-payments': {
    freshnessSeconds: 0,
    privacy: 'private-user',
    staleBehavior: 'show-stale-with-warning',
    invalidatedBy: ['recurring-payments', 'categories', 'payment-methods'],
  },
  budgets: {
    freshnessSeconds: 0,
    privacy: 'private-user',
    staleBehavior: 'show-stale-with-warning',
    invalidatedBy: ['budgets', 'transactions', 'categories'],
  },
  attachments: {
    freshnessSeconds: 0,
    privacy: 'private-user',
    staleBehavior: 'block',
    invalidatedBy: ['attachments', 'transactions'],
  },
  analytics: {
    freshnessSeconds: 0,
    privacy: 'private-user',
    staleBehavior: 'show-stale-with-warning',
    invalidatedBy: ['analytics', 'transactions', 'categories'],
  },
  reports: {
    freshnessSeconds: 0,
    privacy: 'private-user',
    staleBehavior: 'show-stale-with-warning',
    invalidatedBy: ['reports', 'transactions', 'budgets', 'recurring-payments', 'categories'],
  },
  'api-keys': {
    freshnessSeconds: 0,
    privacy: 'private-session',
    staleBehavior: 'block',
    invalidatedBy: ['api-keys', 'session'],
  },
};

export function buildCacheKey(dimensions: CacheDimensions): string {
  const filters = Object.entries(dimensions.filters ?? {})
    .filter((entry): entry is [string, boolean | number | string | string[]] => entry[1] !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(Array.isArray(value) ? [...value].sort().join(',') : String(value))}`,
    )
    .join('&');
  return [
    dimensions.resource,
    `user:${dimensions.userId}`,
    `household:${dimensions.householdId ?? '-'}`,
    `range:${dimensions.from ?? '-'}..${dimensions.to ?? '-'}`,
    `filters:${filters || '-'}`,
    `sort:${dimensions.sort ?? '-'}:${dimensions.order ?? '-'}`,
    `page:${dimensions.page ?? 0}:${dimensions.pageSize ?? '-'}`,
  ].join('|');
}

export function resourcesInvalidatedBy(resource: DataResource): DataResource[] {
  return (Object.entries(cachePolicies) as [DataResource, CachePolicy][])
    .filter(([, policy]) => policy.invalidatedBy.includes(resource))
    .map(([candidate]) => candidate);
}
