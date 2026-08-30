import {afterEach, describe, expect, it, vi} from 'vitest';
import {ApplicationDataService} from './applicationData.service';

describe('ApplicationDataService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exports selected resources as an uncached authenticated ZIP download', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('application archive', {headers: {'content-type': 'application/zip'}}));
    vi.stubGlobal('fetch', fetchMock);

    const [archive, error] = await new ApplicationDataService('https://backend.example').exportArchive({
      format: 'json',
      resources: ['categories', 'transactions'],
    });

    expect(error).toBeNull();
    await expect(archive?.text()).resolves.toBe('application archive');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://backend.example/api/application/export?format=json&resources=categories&resources=transactions',
      expect.objectContaining({cache: 'no-store', credentials: 'include'}),
    );
  });

  it('returns the backend error message for an unsuccessful export', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({message: 'Export unavailable'}), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: {'content-type': 'application/json'},
        }),
      ),
    );

    const [archive, error] = await new ApplicationDataService('https://backend.example').exportArchive({
      format: 'csv',
      resources: ['attachments'],
    });

    expect(archive).toBeNull();
    expect(error?.message).toBe('Export unavailable');
  });
});
