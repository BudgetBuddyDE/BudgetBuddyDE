import {getLogLevel} from '@budgetbuddyde/utils';
import {fromNodeHeaders, toNodeHandler} from 'better-auth/node';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';

import {auth} from './auth';
import {config} from './config';
import {logger} from './core/logger';
import {checkConnection} from './db/pool';
import {connectToRedis, isRedisConnected} from './db/redis';
import {handleError, log, servedBy} from './middleware';
import {ApiResponse, HTTPStatusCode} from './models';

const app = express();

app.use(servedBy);
app.use(log);
app.use(cors(config.cors));

// app.get('/', (_, res) => res.redirect('https://budget-buddy.de'));
app.all(/^\/(api\/)?(status|health)\/?$/, async (_, res) => {
  const isDatabaseConnected = await checkConnection();
  const isRedisReachable = isRedisConnected();
  const isServiceDegraded = isDatabaseConnected && isRedisReachable;

  return ApiResponse.expressBuilder<{status: string; database: boolean; redis: boolean}>(res)
    .withMessage('Status of the application')
    .withStatus(isServiceDegraded ? HTTPStatusCode.OK : HTTPStatusCode.INTERNAL_SERVER_ERROR)
    .withData({
      status: isServiceDegraded ? 'ok' : 'degraded',
      database: isDatabaseConnected,
      redis: isRedisReachable,
    })
    .buildAndSend();
});

app.all('/api/auth/{*splat}', toNodeHandler(auth));
app.get('/api/me', async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  res.json(session);
});

// Mount an global error handler
app.use(handleError);

app.listen(config.port, async () => {
  const options = {
    'Application Name': config.service,
    'Application Version': config.version,
    'Runtime Environment': config.environment,
    'Node Version': process.version,
    'Log Level': getLogLevel(),
    'Server Port': config.port,
  };
  console.table(options);
  logger.info('%s is available under http://localhost:%d', config.service, config.port, options);
  await connectToRedis(true);

  // TODO: Start cron-job which will post-process failed user replications to the backend
});
