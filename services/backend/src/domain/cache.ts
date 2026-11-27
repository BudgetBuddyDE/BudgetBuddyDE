import {invalidateUserCaches} from '../middleware/cache.middleware';
import {mutationCacheRoutes} from '../utils/mutationCacheRoutes';

/** Shared invalidation for successful REST and MCP mutations. */
export async function invalidateDomainMutation(userId: string, routePath: string): Promise<void> {
  await invalidateUserCaches(userId, mutationCacheRoutes(routePath));
}
