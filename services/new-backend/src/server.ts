import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import {config} from './config';
import {checkConnection} from './db';
import {getRedisClient} from './db/redis';
import {logger} from './lib/logger';
import {handleError, log, servedBy, setRequestContext} from './middleware';
import {ApiResponse, HTTPStatusCode} from './models';
import {
  BudgetRouter,
  CategoryRouter,
  MetalRouter,
  PaymentMethodRouter,
  RecurringPaymentRouter,
  StockExchangeRouter,
  TransactionRouter,
} from './router';

export const app = express();

app.use(cors(config.cors));
app.use(setRequestContext);
app.use(log);
app.use(bodyParser.json());
app.use(servedBy);

app.get('/', (_, res) => res.redirect('https://budget-buddy.de'));
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
app.get('/api/me', async (req, res) => {
  ApiResponse.builder<typeof req.context>().withData(req.context).buildAndSend(res);
});
app.use('/api/category', CategoryRouter);
app.use('/api/paymentMethod', PaymentMethodRouter);
app.use('/api/transaction', TransactionRouter);
app.use('/api/recurringPayment', RecurringPaymentRouter);
app.use('/api/budget', BudgetRouter);

app.use('/api/asset/stock/exchange', StockExchangeRouter);
app.use('/api/asset/stock/position', StockExchangeRouter);
// TODO: This feature is not implemented yet (soon)
// app.use('/api/asset/stock/watchlist', StockExchangeRouter);
app.use('/api/asset/metal', MetalRouter);

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
