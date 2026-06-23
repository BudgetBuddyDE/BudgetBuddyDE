import {Api} from './api';

const createJsonResponse = () =>
  new Response(JSON.stringify({status: 200, data: [], totalCount: 0}), {
    headers: {'content-type': 'application/json'},
  });

describe('Api request configuration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies constructor request config to service requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(createJsonResponse());
    const api = new Api('http://backend', {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'x-api-key': 'api-key',
      },
    });

    await api.backend.category.getAll({from: 0, to: 5});

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestConfig = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestConfig.headers);

    expect(requestConfig.cache).toBe('no-store');
    expect(requestConfig.credentials).toBe('include');
    expect(headers.get('accept')).toBe('application/json');
    expect(headers.get('x-api-key')).toBe('api-key');
  });

  it('lets per-request headers override constructor headers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(createJsonResponse());
    const api = new Api('http://backend', {
      headers: {
        Accept: 'application/json',
        'x-api-key': 'default-key',
      },
    });

    await api.backend.category.getAll(undefined, {
      headers: {
        'x-api-key': 'request-key',
        'x-request-id': 'request-id',
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestConfig = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestConfig.headers);

    expect(headers.get('accept')).toBe('application/json');
    expect(headers.get('x-api-key')).toBe('request-key');
    expect(headers.get('x-request-id')).toBe('request-id');
  });
});
