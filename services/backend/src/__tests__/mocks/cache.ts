import {mock, type AnyMock} from './mock';

/** Shared domain-mutation invalidation and route-cache invalidation doubles. */
export const invalidateDomainMutation: AnyMock = mock(async () => {});
export const invalidateUserCaches: AnyMock = mock(async () => {});

export function resetCacheMock(): void {
  invalidateDomainMutation.mockReset();
  invalidateDomainMutation.mockResolvedValue(undefined);
  invalidateUserCaches.mockReset();
  invalidateUserCaches.mockResolvedValue(undefined);
}
