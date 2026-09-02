import {afterEach, describe, expect, it, vi} from 'vitest';
import {BackendService} from './backend.service';
import {clearRequestCache, fetchWithCache, resetRequestCacheForTests} from './requestCache';

class TestBackendService extends BackendService {
  query(value?: object) {
    return this.reqQueryObjToURLSearchParams(value).toString();
  }
}

describe('BackendService', () => {
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

  it('reuses fresh browser responses and invalidates them after mutations', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ok: true}), {headers: {'content-type': 'application/json'}})),
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithCache('/data');
    await fetchWithCache('/data');

    expect(fetchMock).toHaveBeenCalledTimes(1);

    await fetchWithCache('/mutation', {method: 'POST'});
    await fetchWithCache('/data');

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not restore a stale response when an in-flight request resolves after invalidation', async () => {
    vi.stubGlobal('window', {});
    let resolveFirst!: (response: Response) => void;
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(new Promise<Response>(resolve => (resolveFirst = resolve)))
      .mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({version: 2}), {headers: {'content-type': 'application/json'}})),
      );
    vi.stubGlobal('fetch', fetchMock);

    const staleRequest = fetchWithCache('/data');
    clearRequestCache();
    resolveFirst(new Response(JSON.stringify({version: 1}), {headers: {'content-type': 'application/json'}}));
    await staleRequest;
    const freshResponse = await fetchWithCache('/data');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    await expect(freshResponse.json()).resolves.toEqual({version: 2});
  });

  it('does not share browser responses across authorization contexts', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ok: true}), {headers: {'content-type': 'application/json'}})),
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithCache('/data', {headers: {Authorization: 'Bearer user-1'}});
    await fetchWithCache('/data', {headers: {Authorization: 'Bearer user-2'}});

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
