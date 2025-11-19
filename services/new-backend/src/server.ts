import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import { config } from './config';
import { checkConnection } from './db';
import { logger } from './lib/logger';
import { setRequestContext, handleError, log, servedBy } from './middleware';
import { ApiResponse, HTTPStatusCode } from './models';
import { CategoryRouter } from './router';

export const app = express();

app.use(cors(config.cors));
app.use(setRequestContext);
app.use(bodyParser.json());
app.use(log);
app.use(servedBy);

app.get('/', (_, res) => res.redirect('https://budget-buddy.de'));
app.all(/^\/(api\/)?(status|health)\/?$/, async (_, res) => {
  const isDatabaseConnected = await checkConnection();
  // const redisStatus = getRedisClient().status;
  // const isRedisReachable = redisStatus === 'ready';
  const isServiceDegraded = isDatabaseConnected; /*&& isRedisReachable*/

  return ApiResponse.expressBuilder<{
    status: string;
    database: boolean;
    // redis: {
    //   status: ReturnType<typeof getRedisClient>['status'];
    //   isReachable: boolean;
    // };
  }>(res)
    .withMessage('Status of the application')
    .withStatus(isServiceDegraded ? HTTPStatusCode.OK : HTTPStatusCode.INTERNAL_SERVER_ERROR)
    .withData({
      status: isServiceDegraded ? 'ok' : 'degraded',
      database: isDatabaseConnected,
      // redis: {
      //   status: redisStatus,
      //   isReachable: isRedisReachable,
      // },
    })
    .buildAndSend();
});
// app.get('/api/me', async (req, res) => {
//   const session = await auth.api.getSession({
//     headers: fromNodeHeaders(req.headers),
//   });
//   res.json(session);
// });
app.use('/api/category', CategoryRouter);

// Mount an global error handler
app.use(handleError);

export const server = app.listen(config.port, () => {
  const options = {
    'Application Name': config.service,
    'Application Version': config.version,
    'Runtime Environment': config.runtime,
    'Node Version': process.version,
    'Log Level': logger.getLogLevelName(),
    'Server Port': config.port,
    'Trusted Origins': JSON.stringify(config.cors.origin),
  };
  console.table(options);
  logger.info('%s is available under http://localhost:%d', config.service, config.port);
});
