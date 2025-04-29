import {toNodeHandler} from 'better-auth/node';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import http from 'http';

import {auth} from './auth';
import {config} from './config';
import {logger} from './core/logger';
import {checkConnection} from './db/pool';
import {connectToRedis, isRedisConnected} from './db/redis';
import {log, servedBy} from './middleware';
import {ApiResponse} from './models/ApiResponse';

export const app = express();
export const server = http.createServer(app);

app.use(servedBy);
app.use(log);
app.use(cors(config.cors));
// bodyparser

app.all('/api/auth/{*splat}', toNodeHandler(auth));
app.get('/status', async (_, res) => {
  const isDatabaseConnected = await checkConnection();
  const isRedisReachable = isRedisConnected();
  const isServiceHealths = isDatabaseConnected && isRedisReachable;

  return ApiResponse.expressBuilder<{status: string; database: boolean; redis: boolean}>(res)
    .withMessage('Status of the application')
    .withStatus(isServiceHealths ? 200 : 500)
    .withData({
      status: isServiceHealths ? 'ok' : 'degraded',
      database: isDatabaseConnected,
      redis: isRedisReachable,
    })
    .buildAndSend();
});

// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth
app.use(express.json());

export const listen = server.listen(config.port, async () => {
  console.table({
    service: config.service,
    version: config.version,
    port: config.port,
    environment: process.env.NODE_ENV,
    timezone: process.env.TZ,
    nodeVersion: process.version,
    logLevel: config.log.level,
  });

  logger.info('%s is available under http://localhost:%d', config.service, config.port);

  await connectToRedis(true);
});
