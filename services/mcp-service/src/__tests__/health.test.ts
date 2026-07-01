import {afterEach, describe, expect, it, vi} from 'vitest';
import {getHealthStatus} from '../lib/health';

describe('getHealthStatus', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns healthy backend status payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          data: {
            database: true,
            redis: {
              status: 'ready',
              isReachable: true,
            },
          },
        }),
      }),
    );

    const health = await getHealthStatus('http://localhost:9000');

    expect(health).toEqual({
      status: 200,
      message: 'Status of the application',
      data: {
        status: 'ok',
        database: true,
        redis: {
          status: 'ready',
          isReachable: true,
        },
      },
    });
  });

  it('returns degraded payload when backend health check fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Backend unavailable')));

    const health = await getHealthStatus('http://localhost:9000');

    expect(health).toEqual({
      status: 500,
      message: 'Status of the application',
      data: {
        status: 'degraded',
        database: false,
        redis: {
          status: 'unknown',
          isReachable: false,
        },
      },
    });
  });
});
