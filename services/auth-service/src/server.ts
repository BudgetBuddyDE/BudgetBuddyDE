import {getLogLevel} from '@budgetbuddyde/utils';
import {toNodeHandler} from 'better-auth/node';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';

import {auth} from './auth';
import {config} from './config';
import {logger} from './core/logger';
import {logRequest} from './middleware/logRequest';
import {checkConnection} from './pool';
import {redisClient} from './redis';
import {ApiResponse} from './types/ApiResponse.type';

const app = express();
app.use(cors(config.cors));
app.use(logRequest);
app.use((_, res, next) => {
  res.setHeader('X-Served-By', `${config.appName}::${config.version}`);
  next();
});

app.get('/', (_, res) => {
  res.redirect('https://budget-buddy.de');
});

app.get('/status', async (_, res) => {
  return ApiResponse.expressBuilder<{status: string; database: boolean; redis: boolean}>(res)
    .withMessage('Status of the application')
    .withData({
      status: 'ok',
      database: await checkConnection(),
      redis: redisClient.isOpen,
    })
    .buildAndSend();
});

app.all('/api/auth/*', toNodeHandler(auth));

app.listen(config.port, () => {
  const options = {
    'Application Name': config.appName,
    'Application Version': config.version,
    'Runtime Environment': config.environment,
    'Node Version': process.version,
    'Log Level': getLogLevel(),
    'Server Port': config.port,
  };
  console.table(options);
  logger.info('%s is available under http://localhost:%d', config.appName, config.port, options);
});
