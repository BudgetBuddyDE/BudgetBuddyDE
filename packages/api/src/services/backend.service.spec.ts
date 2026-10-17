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

  it('isolates different URLs supplied as Request objects, including concurrent requests', async () => {
    vi.stubGlobal('window', {});
    setRequestCacheScope('user-1:session-1');
    const fetchMock = vi.fn(
      async (input: Request) =>
        new Response(JSON.stringify({url: input.url}), {headers: {'content-type': 'application/json'}}),
    );
    vi.stubGlobal('fetch', fetchMock);
    const [first, second] = await Promise.all([
      fetchWithCache(new Request('https://example.com/categories')),
      fetchWithCache(new Request('https://example.com/transactions')),
    ]);
    expect(await first.json()).toEqual({url: 'https://example.com/categories'});
    expect(await second.json()).toEqual({url: 'https://example.com/transactions'});
    const cached = await fetchWithCache(new Request('https://example.com/categories'));
    expect(await cached.json()).toEqual({url: 'https://example.com/categories'});
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shares a cache entry for the same URL passed as string, URL, or Request', async () => {
    vi.stubGlobal('window', {});
    setRequestCacheScope('user-1:session-1');
    const fetchMock = vi.fn(async () => new Response('{}', {headers: {'content-type': 'application/json'}}));
    vi.stubGlobal('fetch', fetchMock);
    await Promise.all([
      fetchWithCache('https://example.com/private'),
      fetchWithCache(new URL('https://example.com/private')),
      fetchWithCache(new Request('https://example.com/private')),
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
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

  it.each([false, true])('invalidates GETs before and during a mutation, including failure=%s', async fails => {
    vi.stubGlobal('window', {});
    setRequestCacheScope('user-1:session-1');
    let resolveBefore!: (response: Response) => void;
    let resolveDuring!: (response: Response) => void;
    let resolveMutation!: (response: Response) => void;
    let rejectMutation!: (error: Error) => void;
    const jsonResponse = (value: string) =>
      new Response(JSON.stringify({value}), {headers: {'content-type': 'application/json'}});
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => new Promise<Response>(resolve => (resolveBefore = resolve)))
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve, reject) => {
            resolveMutation = resolve;
            rejectMutation = reject;
          }),
      )
      .mockImplementationOnce(() => new Promise<Response>(resolve => (resolveDuring = resolve)))
      .mockImplementation(async () => jsonResponse('fresh'));
    vi.stubGlobal('fetch', fetchMock);

    const before = fetchWithCache('/private');
    const mutation = fetchWithCache('/private', {method: 'POST'}).catch(error => error);
    const during = fetchWithCache('/private');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    if (fails) rejectMutation(new Error('Mutation failed'));
    else resolveMutation(jsonResponse('mutation'));
    await mutation;
    resolveBefore(jsonResponse('stale-before'));
    resolveDuring(jsonResponse('stale-during'));
    await Promise.all([before, during]);

    const fresh = await fetchWithCache('/private');
    expect(await fresh.json()).toEqual({value: 'fresh'});
    const cached = await fetchWithCache('/private');
    expect(await cached.json()).toEqual({value: 'fresh'});
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('does not cache a GET body that finishes reading after mutation invalidation', async () => {
    vi.stubGlobal('window', {});
    setRequestCacheScope('user-1:session-1');
    let bodyController!: ReadableStreamDefaultController<Uint8Array>;
    const response = new Response(
      new ReadableStream<Uint8Array>({start: controller => (bodyController = controller)}),
      {headers: {'content-type': 'application/json'}},
    );
    const clone = vi.spyOn(response, 'clone');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response)
      .mockResolvedValueOnce(new Response('{}'))
      .mockImplementation(
        async () => new Response('{"value":"fresh"}', {headers: {'content-type': 'application/json'}}),
      );
    vi.stubGlobal('fetch', fetchMock);

    const pending = fetchWithCache('/private');
    await vi.waitFor(() => expect(clone).toHaveBeenCalledOnce());
    await fetchWithCache('/private', {method: 'POST'});
    bodyController.enqueue(new TextEncoder().encode('{"value":"stale"}'));
    bodyController.close();
    await pending;

    const fresh = await fetchWithCache('/private');
    expect(await fresh.json()).toEqual({value: 'fresh'});
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
