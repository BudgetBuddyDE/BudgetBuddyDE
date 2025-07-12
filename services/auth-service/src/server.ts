import {fromNodeHeaders, toNodeHandler} from 'better-auth/node';
import cors from 'cors';
import express from 'express';

import {auth} from './auth';
import {config} from './config';
import {logger} from './core/logger';
import {checkConnection} from './db';
import {handleError, log, servedBy} from './middleware';
import {ApiResponse, HTTPStatusCode} from './models';
import {router as JobRouter} from './router/job.router';
import {JobPlanner} from './utils/JobPlanner/JobPlanner';

export const app = express();
export const jobPlanner = new JobPlanner(config.jobs.timezone);

app.use(servedBy);
app.use(log);
app.use(cors(config.cors));

app.get('/', (_, res) => res.redirect('https://budget-buddy.de'));
app.all(/^\/(api\/)?(status|health)\/?$/, async (_, res) => {
  const isDatabaseConnected = await checkConnection();
  const isRedisReachable = false;
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
app.use('/jobs', JobRouter);

// Mount an global error handler
app.use(handleError);

export const server = app.listen(config.port, () => {
  const options = {
    'Application Name': config.service,
    'Application Version': config.version,
    'Runtime Environment': config.runtime,
    'Node Version': process.version,
    'Log Level': config.log.level,
    'Server Port': config.port,
  };
  console.table(options);
  logger.info('%s is available under http://localhost:%d', config.service, config.port, options);

  jobPlanner.addJob('replicate-registered-users', '*/5 * * * *', async ctx => {
    ctx.logger.info('Replicating registered users...');

    await new Promise(resolve => setTimeout(resolve, 1000));

    ctx.logger.info('Replication of registered users completed.');
  });

  logger.info(
    'Scheduled jobs: %s',
    jobPlanner
      .getAllJobs()
      .map(job => job.name)
      .join(', '),
  );
});
