import {toNodeHandler} from 'better-auth/node';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import http from 'http';

import {auth} from './auth';
import {config} from './config';
import {logger} from './core/logger';
import {checkConnection} from './db/pool';
import {log, servedBy} from './middleware';
import {ApiResponse} from './models/ApiResponse';

export const app = express();
export const server = http.createServer(app);

app.use(servedBy);
app.use(log);
app.use(cors(config.cors));
// bodyparser

app.all('/api/auth/{*splat}', toNodeHandler(auth));
// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth
app.use(express.json());

app.get('/status', async (_, res) => {
  return ApiResponse.expressBuilder<{status: string; database: boolean}>(res)
    .withMessage('Status of the application')
    .withData({
      status: 'ok',
      database: await checkConnection(),
    })
    .buildAndSend();
});

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
});
