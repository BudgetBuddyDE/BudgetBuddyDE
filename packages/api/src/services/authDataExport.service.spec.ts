import {afterEach, describe, expect, it, vi} from 'vitest';
import {AuthDataExportService} from './authDataExport.service';

describe('AuthDataExportService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exports auth data from the configured auth host', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('auth archive', {headers: {'content-type': 'application/zip'}}));
    vi.stubGlobal('fetch', fetchMock);

    const [archive, error] = await new AuthDataExportService('https://auth.example').exportArchive('csv');

    expect(error).toBeNull();
    await expect(archive?.text()).resolves.toBe('auth archive');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://auth.example/api/export?format=csv',
      expect.objectContaining({cache: 'no-store', credentials: 'include'}),
    );
  });
});
