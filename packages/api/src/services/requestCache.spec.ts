import {afterEach, describe, expect, it, vi} from 'vite-plus/test';
import {clearRequestCache, fetchWithCache, resetRequestCacheForTests} from './requestCache';

const jsonResponse = (value: unknown) =>
  new Response(JSON.stringify(value), {headers: {'content-type': 'application/json'}});

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

    await fetchWithCache('/value');
    await fetchWithCache('/value');
    expect(fetchMock).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(30_001);
    await fetchWithCache('/value');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache server, no-store, failed or non-JSON responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ok: true}));
    vi.stubGlobal('fetch', fetchMock);
    await fetchWithCache('/server');
    await fetchWithCache('/server');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.stubGlobal('window', {});
    fetchMock.mockResolvedValueOnce(new Response('no', {status: 503}));
    await fetchWithCache('/failed');
    await fetchWithCache('/failed');
    fetchMock.mockResolvedValueOnce(new Response('text', {headers: {'content-type': 'text/plain'}}));
    await fetchWithCache('/text');
    await fetchWithCache('/text');
    await fetchWithCache('/uncached', {cache: 'no-store'});
    await fetchWithCache('/uncached', {cache: 'no-store'});
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });

  it('separates Accept variants and clears cached responses on demand', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ok: true}));
    vi.stubGlobal('fetch', fetchMock);
    await fetchWithCache('/value', {headers: {accept: 'application/json'}});
    await fetchWithCache('/value', {headers: {accept: 'text/plain'}});
    await fetchWithCache('/value', {headers: {accept: 'application/json'}});
    expect(fetchMock).toHaveBeenCalledTimes(2);
    clearRequestCache();
    await fetchWithCache('/value', {headers: {accept: 'application/json'}});
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not cache mutations and invalidates existing entries', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ok: true}));
    vi.stubGlobal('fetch', fetchMock);
    await fetchWithCache('/value');
    await fetchWithCache('/value');
    await fetchWithCache('/value', {method: 'POST'});
    await fetchWithCache('/value');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
