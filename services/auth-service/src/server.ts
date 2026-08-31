import {fromNodeHeaders, toNodeHandler} from 'better-auth/node';
import cors from 'cors';
import express from 'express';
import rateLimit, {ipKeyGenerator} from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import {auth} from './auth';
import {authExportHandler} from './authExport';
import {config} from './config';
import {checkConnection} from './db';
import {getRedisClient} from './db/redis';
import {logger} from './lib/logger';
import {handleError, log, servedBy} from './middleware';
import {ApiResponse, HTTPStatusCode} from './models';

export const app = express();

app.use(cors(config.cors));
if (config.rateLimit.enabled) {
  app.use(
    rateLimit({
      ...config.rateLimit.options,
      store: new RedisStore({
        prefix: config.rateLimit.keyPrefix,
        // biome-ignore lint/suspicious/noExplicitAny: ioredis returns unknown, rate-limit-redis expects RedisReply
        sendCommand: (...args: string[]) => getRedisClient().call(...(args as [string, ...string[]])) as any,
      }),
    }),
  );
  logger.info('Rate limiting is enabled.');
} else logger.warn('Rate limiting is disabled. Make sure to enable it in production to prevent abuse.');
app.all(/^\/(api\/)?(status|health)\/?$/, async (_, res) => {
  const isDatabaseConnected = await checkConnection();
  const redisStatus = config.redis.url ? getRedisClient().status : 'not configured';
  const isRedisReachable = config.redis.url ? redisStatus === 'ready' : undefined;
  const isServiceHealthy = isDatabaseConnected && (isRedisReachable ?? true);

  return ApiResponse.expressBuilder<{
    status: string;
    database: boolean;
    redis: {
      status: string;
      isReachable?: boolean;
    };
  }>(res)
    .withMessage('Status of the application')
    .withStatus(isServiceHealthy ? HTTPStatusCode.OK : HTTPStatusCode.INTERNAL_SERVER_ERROR)
    .withData({
      status: isServiceHealthy ? 'ok' : 'degraded',
      database: isDatabaseConnected,
      redis: {
        status: redisStatus,
        isReachable: isRedisReachable,
      },
    })
    .buildAndSend();
});
app.use(log);
app.use(servedBy);

// Returns a 404
// app.get('/', (_, res) => res.redirect('https://budget-buddy.de'));
app.all('/api/auth/{*splat}', toNodeHandler(auth));
app.get('/api/me', async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  res.json(session);
});
if (config.exportRateLimit.enabled) {
  app.use(
    '/api/export',
    rateLimit({
      ...config.exportRateLimit.options,
      keyGenerator: req => ipKeyGenerator(req.ip ?? 'unknown'),
      store: new RedisStore({
        prefix: config.exportRateLimit.keyPrefix,
        // biome-ignore lint/suspicious/noExplicitAny: ioredis returns unknown, rate-limit-redis expects RedisReply
        sendCommand: (...args: string[]) => getRedisClient().call(...(args as [string, ...string[]])) as any,
      }),
      handler: (_req, res) => {
        ApiResponse.expressBuilder(res)
          .withStatus(HTTPStatusCode.TOO_MANY_REQUESTS)
          .withMessage('Too many export requests. Please try again later.')
          .buildAndSend();
      },
    }),
  );
}
app.get('/api/export', authExportHandler);

// Mount an global error handler
app.use(handleError);

export const server = app.listen(config.port, () => {
  logger.info('Service started', {
    port: config.port,
    url: `http://localhost:${config.port}`,
    nodeVersion: process.version,
    logLevel: config.log.level,
    trustedOrigins: config.cors.origin,
  });
});
