import {mock, type AnyMock} from './mock';

type PipelineMock = {set: AnyMock; del: AnyMock; exec: AnyMock};

type RedisClientMock = {
  status: string;
  on: AnyMock;
  quit: AnyMock;
  disconnect: AnyMock;
  get: AnyMock;
  set: AnyMock;
  setex: AnyMock;
  del: AnyMock;
  mget: AnyMock;
  incr: AnyMock;
  expire: AnyMock;
  keys: AnyMock;
  scan: AnyMock;
  call: AnyMock;
  pipeline: AnyMock;
  pipelineMock: PipelineMock;
};

function createClient(): RedisClientMock {
  const pipeline: PipelineMock = {
    set: mock().mockReturnThis(),
    del: mock().mockReturnThis(),
    exec: mock(async () => []),
  };
  return {
    status: 'ready',
    on: mock(),
    quit: mock(async () => 'OK'),
    disconnect: mock(),
    get: mock(async () => null),
    set: mock(async () => 'OK'),
    setex: mock(async () => 'OK'),
    del: mock(async () => 1),
    mget: mock(async () => []),
    incr: mock(async () => 1),
    expire: mock(async () => 1),
    keys: mock(async () => []),
    scan: mock(async () => ['0', []]),
    call: mock(async () => null),
    pipeline: mock(() => pipeline),
    pipelineMock: pipeline,
  };
}

export const redisClient = createClient();
export const authRedisClient = createClient();

export function getRedisClient(): RedisClientMock {
  return redisClient;
}

export function getAuthRedisClient(): RedisClientMock {
  return authRedisClient;
}

export async function closeRedis(): Promise<void> {}

export function resetRedisMock(): void {
  for (const client of [redisClient, authRedisClient]) {
    for (const value of Object.values(client)) {
      if (typeof value === 'function' && 'mockReset' in value) (value as AnyMock).mockReset();
    }
    client.status = 'ready';
    client.on.mockImplementation(() => client);
    client.quit.mockResolvedValue('OK');
    client.get.mockResolvedValue(null);
    client.set.mockResolvedValue('OK');
    client.setex.mockResolvedValue('OK');
    client.del.mockResolvedValue(1);
    client.mget.mockResolvedValue([]);
    client.incr.mockResolvedValue(1);
    client.expire.mockResolvedValue(1);
    client.keys.mockResolvedValue([]);
    client.scan.mockResolvedValue(['0', []]);
    client.call.mockResolvedValue(null);
    client.pipeline.mockImplementation(() => client.pipelineMock);
    client.pipelineMock.set.mockReset().mockReturnThis();
    client.pipelineMock.del.mockReset().mockReturnThis();
    client.pipelineMock.exec.mockReset().mockResolvedValue([]);
  }
}
