import type {EntityKind} from '@/types/finance';

export const REFERENCE_DATA_MAX_AGE_MS = 5 * 60 * 1000;
export const FINANCE_DATA_MAX_AGE_MS = 30 * 1000;

export interface CachePolicy {
  key: string;
  maxAgeMs: number;
  scope: 'private-user';
  invalidatedBy: EntityKind[];
}

export function createCachePolicy(userId: string, resource: EntityKind, query = ''): CachePolicy {
  const isReferenceData = resource === 'categories' || resource === 'payment-methods';
  return {
    key: ['finance', userId, resource, query].join(':'),
    maxAgeMs: isReferenceData ? REFERENCE_DATA_MAX_AGE_MS : FINANCE_DATA_MAX_AGE_MS,
    scope: 'private-user',
    invalidatedBy: [resource],
  };
}

export function shouldRefresh(fetchedAt: number | null, maxAgeMs: number, now = Date.now()) {
  return fetchedAt === null || now - fetchedAt >= maxAgeMs;
}
