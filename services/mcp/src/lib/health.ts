export type HealthStatusResponse = {
  status: 200 | 500;
  message: string;
  data: {
    status: 'ok' | 'degraded';
    database: boolean;
    redis: {
      status: string;
      isReachable: boolean;
    };
  };
};

const HEALTH_MESSAGE = 'Status of the application';
const HEALTHY_STATUS_CODE = 200;
const DEGRADED_STATUS_CODE = 500;

function buildHealthResponse(input: unknown): HealthStatusResponse {
  const payload = input as
    | {
        data?: {
          database?: unknown;
          redis?: {
            status?: unknown;
            isReachable?: unknown;
          };
        };
      }
    | undefined;
  const isDatabaseConnected = payload?.data?.database === true;
  const redisStatus = typeof payload?.data?.redis?.status === 'string' ? payload.data.redis.status : 'unknown';
  const isRedisReachable = payload?.data?.redis?.isReachable === true;
  const isServiceHealthy = isDatabaseConnected && isRedisReachable;

  return {
    status: isServiceHealthy ? HEALTHY_STATUS_CODE : DEGRADED_STATUS_CODE,
    message: HEALTH_MESSAGE,
    data: {
      status: isServiceHealthy ? 'ok' : 'degraded',
      database: isDatabaseConnected,
      redis: {
        status: redisStatus,
        isReachable: isRedisReachable,
      },
    },
  };
}

export async function getHealthStatus(backendUrl: string): Promise<HealthStatusResponse> {
  try {
    const healthUrl = new URL('/health', backendUrl);
    const response = await fetch(healthUrl);
    const payload = (await response.json()) as unknown;

    return buildHealthResponse(payload);
  } catch {
    return buildHealthResponse(undefined);
  }
}
