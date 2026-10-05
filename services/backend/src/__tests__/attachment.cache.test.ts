import {AttachmentCache} from '../lib/cache/attachment.cache';

const {config, redis, log, pipeline} = vi.hoisted(() => {
  const pipeline = {set: vi.fn().mockReturnThis(), exec: vi.fn()};
  return {
    config: {redis: {url: 'redis://mock'}, attachments: {cacheNamespace: 'attachments'}},
    redis: {set: vi.fn(), get: vi.fn(), del: vi.fn(), mget: vi.fn(), pipeline: vi.fn(() => pipeline)},
    log: {debug: vi.fn(), error: vi.fn()},
    pipeline,
  };
});
vi.mock('../config', () => ({config}));
vi.mock('../db/redis', () => ({getRedisClient: () => redis}));
vi.mock('../lib/logger', () => ({logger: {child: () => log}}));

beforeEach(() => {
  vi.clearAllMocks();
  config.redis.url = 'redis://mock';
  redis.set.mockResolvedValue('OK');
  redis.get.mockResolvedValue(null);
  redis.del.mockResolvedValue(1);
  redis.mget.mockResolvedValue([]);
  pipeline.exec.mockResolvedValue([]);
});

describe('attachment URL cache', () => {
  it('prefixes keys and leaves sixty seconds before expiry', async () => {
    const cache = new AttachmentCache();
    expect(await cache.writeSignedAttachmentUrl('a', 'url', 3600)).toBe('OK');
    expect(redis.set).toHaveBeenCalledWith('attachments:a', 'url', 'EX', 3540);
    await cache.writeSignedAttachmentUrl('b', 'url', 30);
    expect(redis.set).toHaveBeenLastCalledWith('attachments:b', 'url', 'EX', 1);
  });
  it('retrieves cache hits/misses and deletes by attachment ID', async () => {
    redis.get.mockResolvedValueOnce('url');
    const cache = new AttachmentCache();
    expect(await cache.retrieveSignedAttachmentUrl('a')).toBe('url');
    expect(await cache.retrieveSignedAttachmentUrl('b')).toBeNull();
    expect(await cache.deleteSignedAttachmentUrl('a')).toBe(1);
    expect(redis.del).toHaveBeenCalledWith('attachments:a');
  });
  it('bulk reads only populated keys in original order', async () => {
    redis.mget.mockResolvedValue(['url-a', null, 'url-c']);
    expect(await new AttachmentCache().retrieveSignedAttachmentUrls(['a', 'b', 'c'])).toEqual(
      new Map([
        ['a', 'url-a'],
        ['c', 'url-c'],
      ]),
    );
    expect(redis.mget).toHaveBeenCalledWith('attachments:a', 'attachments:b', 'attachments:c');
  });
  it('writes bulk URLs in one pipeline with independent TTLs', async () => {
    await new AttachmentCache().writeSignedAttachmentUrls([
      {attachmentId: 'a', signedUrl: 'url-a', ttlSeconds: 3600},
      {attachmentId: 'b', signedUrl: 'url-b', ttlSeconds: 10},
    ]);
    expect(pipeline.set.mock.calls).toEqual([
      ['attachments:a', 'url-a', 'EX', 3540],
      ['attachments:b', 'url-b', 'EX', 1],
    ]);
    expect(pipeline.exec).toHaveBeenCalledOnce();
  });
  it('avoids bulk calls for empty input', async () => {
    const cache = new AttachmentCache();
    expect(await cache.retrieveSignedAttachmentUrls([])).toEqual(new Map());
    await cache.writeSignedAttachmentUrls([]);
    expect(redis.mget).not.toHaveBeenCalled();
    expect(redis.pipeline).not.toHaveBeenCalled();
  });
  it('degrades to a no-op without configured Redis', async () => {
    config.redis.url = '';
    const cache = new AttachmentCache();
    expect(await cache.writeSignedAttachmentUrl('a', 'url', 100)).toBe('ERROR');
    expect(await cache.retrieveSignedAttachmentUrl('a')).toBeNull();
    expect(await cache.deleteSignedAttachmentUrl('a')).toBe(0);
    expect(await cache.retrieveSignedAttachmentUrls(['a'])).toEqual(new Map());
    await cache.writeSignedAttachmentUrls([{attachmentId: 'a', signedUrl: 'url', ttlSeconds: 100}]);
    expect(redis.set).not.toHaveBeenCalled();
  });
  it('logs Redis failures without rejecting domain operations', async () => {
    redis.set.mockRejectedValue('set failed');
    redis.get.mockRejectedValue(new Error('get failed'));
    redis.del.mockRejectedValue('delete failed');
    redis.mget.mockRejectedValue('bulk failed');
    pipeline.exec.mockRejectedValue('pipeline failed');
    const cache = new AttachmentCache();
    expect(await cache.writeSignedAttachmentUrl('a', 'url', 100)).toBe('ERROR');
    expect(await cache.retrieveSignedAttachmentUrl('a')).toBeNull();
    expect(await cache.deleteSignedAttachmentUrl('a')).toBe(0);
    expect(await cache.retrieveSignedAttachmentUrls(['a'])).toEqual(new Map());
    await cache.writeSignedAttachmentUrls([{attachmentId: 'a', signedUrl: 'url', ttlSeconds: 100}]);
    expect(log.error).toHaveBeenCalledTimes(5);
  });
});
