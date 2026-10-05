const {config, log, redisInstance, s3Instance, poolInstance, constructRedis, constructS3, constructPool, drizzle} =
  vi.hoisted(() => ({
    config: {
      auth: {redis: {url: 'redis://auth', database: 1}},
      database: {connectionString: 'postgres://mock', connectionTimeoutMillis: 1000, maxConnections: 4},
      log: {level: 'info'},
      getRequiredRedisConfig: vi.fn(() => ({url: 'redis://mock', database: 0})),
      getRequiredObjectStorageConfig: vi.fn(() => ({
        region: 'auto',
        endpoint: 'https://storage.test',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        forcePathStyle: true,
      })),
    },
    log: {debug: vi.fn(), info: vi.fn(), error: vi.fn(), child: vi.fn().mockReturnThis()},
    redisInstance: {on: vi.fn(), quit: vi.fn()},
    s3Instance: {destroy: vi.fn()},
    poolInstance: {on: vi.fn(), connect: vi.fn()},
    constructRedis: vi.fn(),
    constructS3: vi.fn(),
    constructPool: vi.fn(),
    drizzle: vi.fn(),
  }));
vi.mock('../config', () => ({config}));
vi.mock('../lib/logger', () => ({logger: log}));
vi.mock('ioredis', () => ({
  default: class {
    constructor(...args: unknown[]) {
      constructRedis(...args);
      return redisInstance;
    }
  },
}));
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    constructor(...args: unknown[]) {
      constructS3(...args);
      return s3Instance;
    }
  },
}));
vi.mock('pg', () => ({
  default: {
    Pool: class {
      constructor(...args: unknown[]) {
        constructPool(...args);
        return poolInstance;
      }
    },
  },
}));
vi.mock('drizzle-orm/node-postgres', () => ({drizzle}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  log.child.mockReturnValue(log);
  config.log.level = 'info';
  redisInstance.quit.mockResolvedValue(undefined);
});
afterEach(() => vi.restoreAllMocks());

it('lazily creates and reuses Redis, emits connection events and closes once', async () => {
  const {getRedisClient, closeRedis} = await import('../db/redis');
  await closeRedis();
  expect(constructRedis).not.toHaveBeenCalled();
  expect(getRedisClient()).toBe(redisInstance);
  expect(getRedisClient()).toBe(redisInstance);
  expect(constructRedis.mock.calls).toEqual([['redis://mock', {db: 0}]]);
  for (const [event, callback] of redisInstance.on.mock.calls) callback(new Error(event));
  expect(log.info).toHaveBeenCalledTimes(3);
  expect(log.error).toHaveBeenCalledWith('Redis error:', expect.any(Error));
  await closeRedis();
  await closeRedis();
  expect(redisInstance.quit).toHaveBeenCalledOnce();
  getRedisClient();
  expect(constructRedis).toHaveBeenCalledTimes(2);
});
it('swallows Redis quit failure and permits a fresh connection', async () => {
  const {getRedisClient, closeRedis} = await import('../db/redis');
  getRedisClient();
  redisInstance.quit.mockRejectedValueOnce(new Error('closed'));
  await expect(closeRedis()).resolves.toBeUndefined();
  getRedisClient();
  expect(constructRedis).toHaveBeenCalledTimes(2);
});
it('creates S3 once from configured credentials and destroys/recreates it', async () => {
  const {getS3Client, destroyS3Client} = await import('../lib/s3');
  destroyS3Client();
  expect(getS3Client()).toBe(s3Instance);
  getS3Client();
  expect(constructS3.mock.calls).toEqual([
    [
      {
        region: 'auto',
        endpoint: 'https://storage.test',
        credentials: {accessKeyId: 'key', secretAccessKey: 'secret'},
        forcePathStyle: true,
      },
    ],
  ]);
  destroyS3Client();
  destroyS3Client();
  expect(s3Instance.destroy).toHaveBeenCalledOnce();
  getS3Client();
  expect(constructS3).toHaveBeenCalledTimes(2);
});
it('checks database connectivity and always releases acquired clients', async () => {
  const release = vi.fn();
  poolInstance.connect.mockResolvedValueOnce({release}).mockRejectedValueOnce(new Error('offline'));
  const {checkConnection} = await import('../db/pool');
  expect(constructPool).toHaveBeenCalledWith({
    connectionString: 'postgres://mock',
    connectionTimeoutMillis: 1000,
    max: 4,
  });
  expect(await checkConnection()).toBe(true);
  expect(release).toHaveBeenCalledOnce();
  expect(await checkConnection()).toBe(false);
  expect(log.error).toHaveBeenCalledWith('Connection to database failed', expect.any(Error));
});
it('logs pool events and terminates only on unexpected idle-client failure', async () => {
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  await import('../db/pool');
  for (const [event, callback] of poolInstance.on.mock.calls) callback(new Error(event));
  expect(log.debug).toHaveBeenCalledTimes(4);
  expect(exit).toHaveBeenCalledWith(-1);
});
it.each(['info', 'debug'])('configures Drizzle logging for %s level', async level => {
  config.log.level = level;
  await import('../db/db');
  const options = drizzle.mock.calls[0][0];
  expect(options.client).toBe(poolInstance);
  expect(options.schema.categories).toBeDefined();
  if (level === 'debug') {
    options.logger.logQuery('SELECT 1', ['a', 2]);
    expect(log.debug).toHaveBeenCalledWith('Query "%s" with params %s executed', 'SELECT 1', 'a, 2');
  } else expect(options.logger).toBeUndefined();
});

it('keeps authentication Redis independently configured and closes both clients', async () => {
  const {getRedisClient, getAuthRedisClient, closeRedis} = await import('../db/redis');
  getRedisClient();
  getAuthRedisClient();
  getAuthRedisClient();
  expect(constructRedis.mock.calls).toEqual([
    ['redis://mock', {db: 0}],
    ['redis://auth', {db: 1, connectTimeout: 5000, commandTimeout: 5000, maxRetriesPerRequest: 1}],
  ]);
  const handlers = redisInstance.on.mock.calls.filter(([name]) => name === 'error');
  handlers[handlers.length - 1][1](new Error('failed'));
  expect(log.error).toHaveBeenCalledWith('Auth Redis error:', expect.any(Error));
  await closeRedis();
  expect(redisInstance.quit).toHaveBeenCalledTimes(2);
});
it('rejects authentication Redis use when no URL is configured', async () => {
  config.auth.redis.url = '';
  try {
    const {getAuthRedisClient} = await import('../db/redis');
    expect(() => getAuthRedisClient()).toThrow('AUTH_REDIS_URL');
  } finally {
    config.auth.redis.url = 'redis://auth';
  }
});
