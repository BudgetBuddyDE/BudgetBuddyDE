import {afterEach, describe, expect, it, vi} from 'vite-plus/test';
import {clearRequestCache, fetchWithCache, resetRequestCacheForTests} from './requestCache';

const jsonResponse = (value: unknown) =>
  new Response(JSON.stringify(value), {headers: {'content-type': 'application/json'}});
const anonymous = {credentials: 'omit'} as const;

describe('request cache', () => {
  afterEach(() => {
    resetRequestCacheForTests();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('caches successful JSON GETs in browsers for 30 seconds', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({value: 1}));
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithCache('/value', anonymous);
    await fetchWithCache('/value', anonymous);
    expect(fetchMock).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(30_001);
    await fetchWithCache('/value', anonymous);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache server, no-store, failed or non-JSON responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ok: true}));
    vi.stubGlobal('fetch', fetchMock);
    await fetchWithCache('/server', anonymous);
    await fetchWithCache('/server', anonymous);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.stubGlobal('window', {});
    fetchMock.mockResolvedValueOnce(new Response('no', {status: 503}));
    await fetchWithCache('/failed', anonymous);
    await fetchWithCache('/failed', anonymous);
    fetchMock.mockResolvedValueOnce(new Response('text', {headers: {'content-type': 'text/plain'}}));
    await fetchWithCache('/text', anonymous);
    await fetchWithCache('/text', anonymous);
    await fetchWithCache('/uncached', {...anonymous, cache: 'no-store'});
    await fetchWithCache('/uncached', {...anonymous, cache: 'no-store'});
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });

  it('separates Accept variants and clears cached responses on demand', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ok: true}));
    vi.stubGlobal('fetch', fetchMock);
    await fetchWithCache('/value', {...anonymous, headers: {accept: 'application/json'}});
    await fetchWithCache('/value', {...anonymous, headers: {accept: 'text/plain'}});
    await fetchWithCache('/value', {...anonymous, headers: {accept: 'application/json'}});
    expect(fetchMock).toHaveBeenCalledTimes(2);
    clearRequestCache();
    await fetchWithCache('/value', {...anonymous, headers: {accept: 'application/json'}});
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not cache mutations and invalidates existing entries', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ok: true}));
    vi.stubGlobal('fetch', fetchMock);
    await fetchWithCache('/value', anonymous);
    await fetchWithCache('/value', anonymous);
    await fetchWithCache('/value', {method: 'POST'});
    await fetchWithCache('/value', anonymous);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([undefined, {credentials: 'include'}, {...anonymous, headers: {authorization: 'Bearer fixture'}}] as const)(
    'uses separate no-store network requests for potentially authenticated reads (%j)',
    async options => {
      vi.stubGlobal('window', {});
      const pending = Promise.withResolvers<Response>();
      const fetchMock = vi
        .fn()
        .mockReturnValueOnce(pending.promise)
        .mockImplementation(() => jsonResponse('fresh'));
      vi.stubGlobal('fetch', fetchMock);
      const first = fetchWithCache('/value', options);
      const second = fetchWithCache('/value', options);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenLastCalledWith('/value', {...options, cache: 'no-store'});
      pending.resolve(jsonResponse('first'));
      await expect((await first).json()).resolves.toBe('first');
      await expect((await second).json()).resolves.toBe('fresh');
      await fetchWithCache('/value', options);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    },
  );

  it('retires pending reads at mutation start and completion', async () => {
    vi.stubGlobal('window', {});
    const before = Promise.withResolvers<Response>();
    const during = Promise.withResolvers<Response>();
    const write = Promise.withResolvers<Response>();
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(before.promise)
      .mockReturnValueOnce(write.promise)
      .mockReturnValueOnce(during.promise)
      .mockResolvedValueOnce(jsonResponse('current'));
    vi.stubGlobal('fetch', fetchMock);
    const oldRead = fetchWithCache('/value', anonymous);
    const mutation = fetchWithCache('/value', {method: 'POST'});
    const concurrentRead = fetchWithCache('/value', anonymous);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    write.resolve(jsonResponse('saved'));
    await mutation;
    await expect((await fetchWithCache('/value', anonymous)).json()).resolves.toBe('current');
    before.resolve(jsonResponse('before'));
    during.resolve(jsonResponse('during'));
    await Promise.all([oldRead, concurrentRead]);
    await expect((await fetchWithCache('/value', anonymous)).json()).resolves.toBe('current');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
