import {fromNodeHeaders, toNodeHandler} from 'better-auth/node';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import {auth} from './auth';
import {config} from './config';
import {checkConnection} from './db';
import {getRedisClient} from './db/redis';
import {logger} from './lib/logger';
import {handleError, log, servedBy} from './middleware';
import {ApiResponse, HTTPStatusCode} from './models';

export const app = express();

app.use(cors(config.cors));
if (config.runtime === 'production') {
  app.use(
    rateLimit({
      ...config.rateLimit,
      store: new RedisStore({
        prefix: `rate-limit:${config.service}:`,
        // biome-ignore lint/suspicious/noExplicitAny: ioredis returns unknown, rate-limit-redis expects RedisReply
        sendCommand: (...args: string[]) => getRedisClient().call(...(args as [string, ...string[]])) as any,
      }),
    }),
  );
  logger.info('Rate limiting is enabled in production environment.');
} else
  logger.warn(
    'Rate limiting is disabled in non-production environments. Make sure to enable it in production to prevent abuse.',
  );
app.all(/^\/(api\/)?(status|health)\/?$/, async (_, res) => {
  const isDatabaseConnected = await checkConnection();
  const redisStatus = getRedisClient().status;
  const isRedisReachable = redisStatus === 'ready';
  const isServiceDegraded = isDatabaseConnected && isRedisReachable;

  return ApiResponse.expressBuilder<{
    status: string;
    database: boolean;
    redis: {
      status: ReturnType<typeof getRedisClient>['status'];
      isReachable: boolean;
    };
  }>(res)
    .withMessage('Status of the application')
    .withStatus(isServiceDegraded ? HTTPStatusCode.OK : HTTPStatusCode.INTERNAL_SERVER_ERROR)
    .withData({
      status: isServiceDegraded ? 'ok' : 'degraded',
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

// Mount an global error handler
app.use(handleError);

export const server = app.listen(config.port, () => {
  const options = {
    'Application Name': config.service,
    'Application Version': config.version,
    'Runtime Environment': config.runtime,
    'Node Version': process.version,
    'Log Level': logger.level,
    'Server Port': config.port,
    'Trusted Origins': JSON.stringify(config.cors.origin),
  };
  console.table(options);
  logger.info('%s is available under http://localhost:%d', config.service, config.port, options);
});
