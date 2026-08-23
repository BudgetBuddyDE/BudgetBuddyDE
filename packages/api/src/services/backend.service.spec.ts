import {afterEach, describe, expect, it, vi} from 'vitest';
import {BackendService} from './backend.service';
import {fetchWithCache, resetRequestCacheForTests} from './requestCache';

class TestBackendService extends BackendService {
  query(value?: object) {
    return this.reqQueryObjToURLSearchParams(value).toString();
  }

  baseRequestPath() {
    return this.getBaseRequestPath();
  }
}

describe('BackendService', () => {
  it('supports direct and gateway-prefixed service URLs', () => {
    expect(new TestBackendService('https://prod.backend.example', '/api/transaction').baseRequestPath()).toBe(
      'https://prod.backend.example/api/transaction',
    );
    expect(
      new TestBackendService('https://prod.gateway.example/backend/v1/', '/api/transaction').baseRequestPath(),
    ).toBe('https://prod.gateway.example/backend/v1/api/transaction');
  });

  it('creates deterministic query strings and omits empty values', () => {
    const service = new TestBackendService('', '');

    expect(service.query({z: 'last', optional: undefined, categories: ['b', 'a'], from: 0, nullable: null})).toBe(
      'categories=b&categories=a&from=0&z=last',
    );
  });
});

describe('fetchWithCache', () => {
  afterEach(() => {
    resetRequestCacheForTests();
    vi.unstubAllGlobals();
  });

  it('deduplicates concurrent browser GET requests and returns independent responses', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>(resolve => {
          setTimeout(
            () => resolve(new Response(JSON.stringify({ok: true}), {headers: {'content-type': 'application/json'}})),
            0,
          );
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const [first, second] = await Promise.all([fetchWithCache('/data'), fetchWithCache('/data')]);

    expect(fetchMock).toHaveBeenCalledOnce();
    await expect(first.json()).resolves.toEqual({ok: true});
    await expect(second.json()).resolves.toEqual({ok: true});
  });
});
