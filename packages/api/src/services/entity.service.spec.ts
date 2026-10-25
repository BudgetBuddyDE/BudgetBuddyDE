import {afterEach, describe, expect, it, vi} from 'vite-plus/test';
import {CategoryService} from './category.service';
import {resetRequestCacheForTests} from './requestCache';

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {headers: {'content-type': 'application/json'}});

describe('EntityService CRUD requests', () => {
  afterEach(() => {
    resetRequestCacheForTests();
    vi.unstubAllGlobals();
  });

  it('sends authenticated CRUD requests with payloads and validates responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({status: 200, data: []}))
      .mockResolvedValueOnce(jsonResponse({status: 200, data: null}))
      .mockResolvedValueOnce(jsonResponse({status: 201, data: []}))
      .mockResolvedValueOnce(jsonResponse({status: 200, data: []}))
      .mockResolvedValueOnce(jsonResponse({status: 200, data: null}));
    vi.stubGlobal('fetch', fetchMock);
    const service = new CategoryService('https://api.example');

    await expect(service.getAll({$limit: 10})).resolves.toMatchObject([{status: 200}, null]);
    await expect(service.getById('category-id')).resolves.toMatchObject([{status: 200}, null]);
    await expect(service.create({name: 'Food'})).resolves.toMatchObject([{status: 201}, null]);
    await expect(service.updateById('category-id', {name: 'Groceries'})).resolves.toMatchObject([{status: 200}, null]);
    await expect(service.deleteById('category-id')).resolves.toMatchObject([{status: 200}, null]);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://api.example/api/category?%24limit=10',
      'https://api.example/api/category/category-id',
      'https://api.example/api/category',
      'https://api.example/api/category/category-id',
      'https://api.example/api/category/category-id',
    ]);
    expect(fetchMock.mock.calls.map(([, init]) => init?.method ?? 'GET')).toEqual([
      'GET',
      'GET',
      'POST',
      'PUT',
      'DELETE',
    ]);
    expect(fetchMock.mock.calls[2][1]).toMatchObject({credentials: 'include', body: JSON.stringify({name: 'Food'})});
    expect(fetchMock.mock.calls[3][1]).toMatchObject({
      credentials: 'include',
      body: JSON.stringify({name: 'Groceries'}),
    });
  });

  it('projects value-help fields and maps null data to an empty array', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({status: 200, data: null}));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new CategoryService('https://api.example').getValueHelp()).resolves.toEqual([[], null]);
  });
});
