import type {Server} from 'node:http';
import {toNodeHandler} from 'better-auth/node';
import cors from 'cors';
import express, {type Express, type Request, type Response} from 'express';
import rateLimit, {ipKeyGenerator} from 'express-rate-limit';
import {setGlobalErrorHandler} from 'express-zod-safe';
import cron from 'node-cron';
import RedisStore from 'rate-limit-redis';
import {auth} from './auth';
import {authExportHandler} from './authExport';
import {config} from './config';
import {checkConnection, pool} from './db';
import {closeRedis, getAuthRedisClient, getRedisClient} from './db/redis';
import {processRecurringPayments} from './jobs/processRecurringPayments';
import {logger} from './lib/logger';
import {destroyS3Client} from './lib/s3';
import {closeMcpServers, createMcpRouter, validateMcpOrigin} from './mcp/router';
import {cacheResponse, handleError, invalidateCache, logRequest, servedBy, setRequestContext} from './middleware';
import {ApiResponse, HTTPStatusCode} from './models';
import {
  ApplicationRouter,
  AttachmentRouter,
  BudgetRouter,
  CategoryRouter,
  InsightsRouter,
  PaymentMethodRouter,
  RecurringPaymentRouter,
  TransactionRouter,
} from './router';

const HEALTH_CHECK_TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs = HEALTH_CHECK_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<T>(resolve => {
      timer = setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function healthHandler(_req: Request, res: Response) {
  const isDatabaseConnected = await withTimeout(checkConnection(), false);
  const redis = config.redis.url
    ? {status: getRedisClient().status as string, isReachable: getRedisClient().status === 'ready'}
    : {status: 'not_configured', isReachable: true};
  const authRedis = config.auth.redis.url
    ? {status: getAuthRedisClient().status as string, isReachable: getAuthRedisClient().status === 'ready'}
    : {status: 'not_configured', isReachable: true};
  const isHealthy = isDatabaseConnected && redis.isReachable && authRedis.isReachable;

  return ApiResponse.expressBuilder<{
    status: string;
    database: boolean;
    redis: {
      status: string;
      isReachable: boolean;
    };
    authRedis: {status: string; isReachable: boolean};
  }>(res)
    .withMessage('Status of the application')
    .withStatus(isHealthy ? HTTPStatusCode.OK : HTTPStatusCode.INTERNAL_SERVER_ERROR)
    .withData({
      status: isHealthy ? 'ok' : 'degraded',
      database: isDatabaseConnected,
      redis,
      authRedis,
    })
    .buildAndSend();
}

/** Builds the Express application without starting the HTTP listener. */
export function createApp(): Express {
  const app = express();

  app.set('trust proxy', config.trustProxy);
  app.use('/mcp', validateMcpOrigin);
  app.use(cors(config.cors));
  // Public auth routes must keep the raw request stream and bypass domain authentication/cache.
  app.use(logRequest);
  app.use(servedBy);
  const authRedisStore = (prefix: string) =>
    new RedisStore({
      prefix,
      // biome-ignore lint/suspicious/noExplicitAny: RedisStore requires a RedisReply return type.
      sendCommand: (...args: string[]) =>
        (config.auth.redis.url ? getAuthRedisClient() : getRedisClient()).call(
          ...(args as [string, ...string[]]),
        ) as any,
    });
  if (config.auth.rateLimit.enabled) {
    app.use(
      '/api/auth',
      rateLimit({...config.auth.rateLimit.options, store: authRedisStore(config.auth.rateLimit.keyPrefix)}),
    );
  }
  if (config.auth.exportRateLimit.enabled) {
    app.use(
      '/api/auth/export',
      rateLimit({
        ...config.auth.exportRateLimit.options,
        keyGenerator: req => ipKeyGenerator(req.ip ?? 'unknown'),
        store: authRedisStore(config.auth.exportRateLimit.keyPrefix),
        handler: (_req, res) => {
          ApiResponse.expressBuilder(res)
            .withStatus(HTTPStatusCode.TOO_MANY_REQUESTS)
            .withMessage('Too many export requests. Please try again later.')
            .buildAndSend();
        },
      }),
    );
  }
  app.get('/api/auth/export', authExportHandler);
  app.all('/api/auth/{*splat}', toNodeHandler(auth));
  app.use('/mcp', createMcpRouter());
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

  app.head('/health', (_req, res) => {
    res.status(HTTPStatusCode.OK).end();
  });
  app.get('/health', healthHandler);

  app.use(setRequestContext);
  app.use(express.json());
  app.use(cacheResponse);
  app.use(invalidateCache);

  // Set a global error handler for validation errors
  setGlobalErrorHandler((errors, _req, res) => {
    ApiResponse.builder()
      .withStatus(HTTPStatusCode.BAD_REQUEST)
      .withMessage('Validation Error')
      .withData(errors)
      .buildAndSend(res);
  });

  app.get('/api/me', async (req, res) => {
    ApiResponse.builder<typeof req.context>().withData(req.context).buildAndSend(res);
  });
  app.delete('/api/me', async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    ApiResponse.builder().withStatus(HTTPStatusCode.NOT_IMPLEMENTED).withMessage('Not implemented').buildAndSend(res);
  });
  app.use('/api/application', ApplicationRouter);
  app.use('/api/category', CategoryRouter);
  app.use('/api/paymentMethod', PaymentMethodRouter);
  app.use('/api/transaction', TransactionRouter);
  app.use('/api/recurringPayment', RecurringPaymentRouter);
  app.use('/api/budget', BudgetRouter);
  app.use('/api/insights', InsightsRouter);
  app.use('/api/attachment', AttachmentRouter);

  // Final 404 for unmatched API routes
  app.use('/api', (_req, res) => {
    ApiResponse.builder().withStatus(HTTPStatusCode.NOT_FOUND).withMessage('Not Found').buildAndSend(res);
  });

  // Mount an global error handler
  app.use(handleError);

  return app;
}

let scheduledJob: ReturnType<typeof cron.schedule> | undefined;

async function stopServer(server: Server, signal: NodeJS.Signals): Promise<void> {
  logger.info('Received %s, shutting down gracefully', signal);
  scheduledJob?.stop();
  const closed = new Promise<void>(resolve => server.close(() => resolve()));
  await closeMcpServers();
  await closed;
  await Promise.allSettled([pool.end(), closeRedis()]);
  destroyS3Client();
  logger.info('Shutdown complete');
  process.exit(0);
}

/** Starts the HTTP listener, scheduled jobs, and graceful shutdown handling. */
export function startServer(): Server {
  const app = createApp();
  const server = app.listen(config.port, () => {
    const options = {
      'Application Name': config.service,
      'Application Version': config.version,
      'Runtime Environment': config.runtime,
      'Node Version': process.version,
      'Log Level': config.log.level,
      'Server Port': config.port,
      'Trusted Origins': JSON.stringify(config.cors.origin),
    };
    logger.info('%s is available under http://localhost:%d', config.service, config.port, {...options});

    const recurringPaymentsJob = config.jobs.recurringPayments;
    scheduledJob = cron.schedule(recurringPaymentsJob.schedule, processRecurringPayments, {
      name: recurringPaymentsJob.name,
      timezone: recurringPaymentsJob.timezone,
    });
    logger.info(
      'Scheduled job "%s" with schedule "%s" (%s timezone)',
      recurringPaymentsJob.name,
      recurringPaymentsJob.schedule,
      recurringPaymentsJob.timezone,
      {
        job: recurringPaymentsJob.name,
        schedule: recurringPaymentsJob.schedule,
        timezone: recurringPaymentsJob.timezone,
      },
    );
  });

  const shutdown = (signal: NodeJS.Signals) => {
    void stopServer(server, signal);
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);

  return server;
}

if (require.main === module) {
  startServer();
}
