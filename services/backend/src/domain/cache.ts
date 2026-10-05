import {invalidateUserCaches} from '../middleware/cache.middleware';

const dependencies: Record<string, readonly string[]> = {
  '/api/category': ['/api/category', '/api/transaction', '/api/recurringPayment', '/api/budget', '/api/insights'],
  '/api/paymentMethod': [
    '/api/paymentMethod',
    '/api/transaction',
    '/api/recurringPayment',
    '/api/budget',
    '/api/insights',
  ],
  '/api/transaction': ['/api/transaction', '/api/budget', '/api/insights'],
  '/api/recurringPayment': ['/api/recurringPayment', '/api/budget'],
  '/api/budget': ['/api/budget'],
};

/** Shared invalidation for successful REST and MCP mutations. */
export async function invalidateDomainMutation(userId: string, routePath: string): Promise<void> {
  await invalidateUserCaches(userId, dependencies[routePath] ?? [routePath]);
}
