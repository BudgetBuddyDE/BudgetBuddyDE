import {invalidateDomainMutation} from '../domain/cache';

const {invalidateUserCaches} = vi.hoisted(() => ({invalidateUserCaches: vi.fn()}));
vi.mock('../middleware/cache.middleware', () => ({invalidateUserCaches}));

it('invalidates budget and insights results for shared REST/MCP budget mutations', async () => {
  await invalidateDomainMutation('owner', '/api/budget');
  expect(invalidateUserCaches).toHaveBeenCalledWith('owner', ['/api/budget', '/api/insights']);
});
