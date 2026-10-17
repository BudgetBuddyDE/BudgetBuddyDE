import {afterEach, describe, expect, it, vi} from 'vitest';
import {BackendService} from './backend.service';
import {fetchWithCache, resetRequestCacheForTests, setRequestCacheScope} from './requestCache';

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
    setRequestCacheScope('user-1:session-1');
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

  it('does not reuse cached responses across session scopes', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({value: fetchMock.mock.calls.length}), {
          headers: {'content-type': 'application/json'},
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    setRequestCacheScope('user-1:session-1');
    await fetchWithCache('/private');
    setRequestCacheScope('user-2:session-2');
    await fetchWithCache('/private');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache private responses without a confirmed session scope', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn(async () => new Response('{}', {headers: {'content-type': 'application/json'}}));
    vi.stubGlobal('fetch', fetchMock);
    await fetchWithCache('/private');
    await fetchWithCache('/private');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('bypasses the session cache when Authorization is set on a Request input', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn(async () => new Response('{}', {headers: {'content-type': 'application/json'}}));
    vi.stubGlobal('fetch', fetchMock);
    setRequestCacheScope('user-1:session-1');
    const request = new Request('https://example.com/private', {headers: {Authorization: 'Bearer api-key'}});
    await fetchWithCache(request);
    await fetchWithCache(request);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not treat a Request input with a mutation method as a cacheable GET', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn(async () => new Response('{}', {headers: {'content-type': 'application/json'}}));
    vi.stubGlobal('fetch', fetchMock);
    setRequestCacheScope('user-1:session-1');
    const request = new Request('https://example.com/private', {method: 'POST'});
    await fetchWithCache(request);
    await fetchWithCache(request);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not let an in-flight response from a previous session populate the new scope', async () => {
    vi.stubGlobal('window', {});
    let resolvePrevious!: (response: Response) => void;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Response>(resolve => {
            resolvePrevious = resolve;
          }),
      )
      .mockResolvedValue(new Response('{"owner":"next"}', {headers: {'content-type': 'application/json'}}));
    vi.stubGlobal('fetch', fetchMock);

    setRequestCacheScope('user-1:session-1');
    const previousSessionRequest = fetchWithCache('/private');
    setRequestCacheScope('user-2:session-2');
    const currentSessionResponse = await fetchWithCache('/private');
    resolvePrevious(new Response('{"owner":"previous"}', {headers: {'content-type': 'application/json'}}));
    await previousSessionRequest;
    await currentSessionResponse.json();
    const cachedCurrentResponse = await fetchWithCache('/private');

    expect(await cachedCurrentResponse.json()).toEqual({owner: 'next'});
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
