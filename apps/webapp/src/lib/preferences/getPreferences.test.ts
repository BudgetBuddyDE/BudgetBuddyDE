// @vitest-environment node
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {getPreferences} from './getPreferences';

const mocks = vi.hoisted(() => ({get: vi.fn(), headers: vi.fn()}));
vi.mock('server-only', () => ({}));
vi.mock('@/apiClient', () => ({apiClient: {backend: {preference: {get: mocks.get}}}}));
vi.mock('@/lib/headers', () => ({headers: mocks.headers}));

beforeEach(() => vi.clearAllMocks());

describe('getPreferences', () => {
  it('forwards authenticated headers, disables caching, and preserves the success tuple', async () => {
    const headers = {cookie: 'better-auth.session_token=test-session', authorization: 'Bearer test-key'};
    const result = [{data: {ownerId: 'alice', currency: 'USD'}}, null] as const;
    mocks.headers.mockResolvedValue(headers);
    mocks.get.mockResolvedValue(result);

    expect(await getPreferences()).toBe(result);
    expect(mocks.get).toHaveBeenCalledWith({headers, cache: 'no-store'});
  });

  it('preserves the API error tuple without throwing or replacing the error', async () => {
    const headers = {cookie: 'better-auth.session_token=expired'};
    const error = new Error('Unauthorized');
    const result = [null, error] as const;
    mocks.headers.mockResolvedValue(headers);
    mocks.get.mockResolvedValue(result);

    expect(await getPreferences()).toBe(result);
    expect(mocks.get).toHaveBeenCalledWith({headers, cache: 'no-store'});
  });
});
