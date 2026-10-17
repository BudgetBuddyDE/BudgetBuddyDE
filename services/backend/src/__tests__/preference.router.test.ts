import {beforeEach, describe, expect, it, vi} from 'vitest';
import {requestRouter} from './router.test-utils';

const mocks = vi.hoisted(() => ({get: vi.fn(), update: vi.fn()}));
vi.mock('../domain/preference', () => mocks);

import {preferenceRouter} from '../router/preference.router';

describe('preference router', () => {
  beforeEach(() => vi.resetAllMocks());

  it('requires authentication on reads and writes', async () => {
    expect((await requestRouter(preferenceRouter, null, '/', {method: 'GET'})).status).toBe(401);
    expect((await requestRouter(preferenceRouter, null, '/', {method: 'PUT', body: {language: 'en_US'}})).status).toBe(
      401,
    );
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('passes only the authenticated user and validated update payload to the domain', async () => {
    mocks.get.mockResolvedValue({status: 200, data: {ownerId: 'user-a'}});
    mocks.update.mockResolvedValue({status: 200, data: {ownerId: 'user-a', language: 'de_DE'}});

    const fetched = await requestRouter(preferenceRouter, 'user-a', '/', {method: 'GET'});
    const updated = await requestRouter(preferenceRouter, 'user-a', '/', {
      method: 'PUT',
      body: {language: 'de_DE'},
    });

    expect(fetched.status).toBe(200);
    expect(mocks.get).toHaveBeenCalledExactlyOnceWith('user-a');
    expect(updated.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith('user-a', {language: 'de_DE'});
  });

  it('rejects malformed updates before domain execution', async () => {
    const result = await requestRouter(preferenceRouter, 'user-a', '/', {
      method: 'PUT',
      body: {ownerId: 'user-b', onboardingCompleted: true},
    });

    expect(result.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
