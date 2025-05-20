import {fromNodeHeaders, toNodeHandler} from 'better-auth/node';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import http from 'http';

import {auth} from './auth';
import {config} from './config';
import {logger} from './core/logger';
import {checkConnection} from './db/pool';
import {connectToRedis, isRedisConnected} from './db/redis';
import {auth as authMdlware, handleError, log, servedBy} from './middleware';
import {ApiResponse} from './models/ApiResponse';
import {EntityRouter} from './router';
import {BudgetService, CategoryService, PaymentMethodService, SubscriptionService, TransactionService} from './service';

export const app = express();
export const server = http.createServer(app);

app.use(servedBy);
app.use(log);
app.use(cors(config.cors));
app.use(authMdlware);

app.all('/api/auth/{*splat}', toNodeHandler(auth));
app.get('/api/me', async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  res.json(session);
});
app.all(/^\/(api\/)?(status|health)\/?$/, async (_, res) => {
  const isDatabaseConnected = await checkConnection();
  const isRedisReachable = isRedisConnected();
  const isServiceDegraded = isDatabaseConnected && isRedisReachable;

  return ApiResponse.expressBuilder<{status: string; database: boolean; redis: boolean}>(res)
    .withMessage('Status of the application')
    .withStatus(isServiceDegraded ? 200 : 500)
    .withData({
      status: isServiceDegraded ? 'ok' : 'degraded',
      database: isDatabaseConnected,
      redis: isRedisReachable,
    })
    .buildAndSend();
});

// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth
app.use(express.json());

EntityRouter.builder(new CategoryService(), '/api/category').withDefaultRoutes().build().mount(app);
EntityRouter.builder(new PaymentMethodService(), '/api/payment-method').withDefaultRoutes().build().mount(app);
EntityRouter.builder(new TransactionService(), '/api/transaction').withDefaultRoutes().build().mount(app);
EntityRouter.builder(new SubscriptionService(), '/api/subscription').withDefaultRoutes().build().mount(app);
EntityRouter.builder(new BudgetService(), '/api/budget').withGetAllRoute().withGetByIdRoute().build().mount(app);

// TODO: Handle ZodError and other errors based on their type
// Mount an global error handler
app.use(handleError);

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

  // TODO: Init job scheduler
});
