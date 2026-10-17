import {afterEach, describe, expect, it, vi} from 'vitest';
import {BackendService} from './backend.service';
import {fetchWithCache, resetRequestCacheForTests, setRequestCacheScope} from './requestCache';

class TestBackendService extends BackendService {
  send(input: RequestInfo | URL, init?: RequestInit) {
    return this.request(input, init);
  }
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

  it('invalidates cached GET responses when mutations go through BackendService', async () => {
    vi.stubGlobal('window', {});
    setRequestCacheScope('user-1:session-1');
    const json = (value: string) =>
      new Response(JSON.stringify({value}), {headers: {'content-type': 'application/json'}});
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json('old'))
      .mockResolvedValueOnce(json('mutation'))
      .mockImplementation(async () => json('fresh'));
    vi.stubGlobal('fetch', fetchMock);
    const service = new TestBackendService('', '');
    await service.send('/private');
    await service.send('/private', {method: 'POST'});
    expect(await (await service.send('/private')).json()).toEqual({value: 'fresh'});
    expect(await (await service.send('/private')).json()).toEqual({value: 'fresh'});
    expect(fetchMock).toHaveBeenCalledTimes(3);
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

  it('keeps responses with different representation headers in separate cache entries', async () => {
    vi.stubGlobal('window', {});
    setRequestCacheScope('user-1:session-1');
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const language = new Headers(init?.headers).get('accept-language');
      return new Response(JSON.stringify({language}), {headers: {'content-type': 'application/json'}});
    });
    vi.stubGlobal('fetch', fetchMock);

    const english = await fetchWithCache('/localized', {headers: {'Accept-Language': 'en'}});
    const german = await fetchWithCache('/localized', {headers: {'Accept-Language': 'de'}});
    const cachedEnglish = await fetchWithCache('/localized', {headers: {'Accept-Language': 'en'}});

    await expect(english.json()).resolves.toEqual({language: 'en'});
    await expect(german.json()).resolves.toEqual({language: 'de'});
    await expect(cachedEnglish.json()).resolves.toEqual({language: 'en'});
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache Requests that carry no-store or an explicit API key', async () => {
    vi.stubGlobal('window', {});
    setRequestCacheScope('user-1:session-1');
    const fetchMock = vi.fn(async () => new Response('{}', {headers: {'content-type': 'application/json'}}));
    vi.stubGlobal('fetch', fetchMock);
    const noStoreRequest = new Request('https://example.com/no-store', {cache: 'no-store'});
    const apiKeyRequest = new Request('https://example.com/api-key', {headers: {'x-api-key': 'secret'}});

    await fetchWithCache(noStoreRequest);
    await fetchWithCache(noStoreRequest);
    await fetchWithCache(apiKeyRequest);
    await fetchWithCache(apiKeyRequest);

    expect(fetchMock).toHaveBeenCalledTimes(4);
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

  it('does not cache a Request body when init overrides its method to GET', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn(async () => new Response('{}', {headers: {'content-type': 'application/json'}}));
    vi.stubGlobal('fetch', fetchMock);
    setRequestCacheScope('user-1:session-1');
    const request = new Request('https://example.com/private', {method: 'POST', body: 'payload'});

    await fetchWithCache(request, {method: 'GET'});
    await fetchWithCache(request, {method: 'GET'});

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
