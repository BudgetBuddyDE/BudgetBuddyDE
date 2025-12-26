import {trace} from '@opentelemetry/api';
import bodyParser from 'body-parser';
import cors from 'cors';
import {eq} from 'drizzle-orm';
import express from 'express';
import {setGlobalErrorHandler} from 'express-zod-safe';
import cron from 'node-cron';
import {config} from './config';
import {checkConnection, db} from './db';
import {getRedisClient} from './db/redis';
import {budgets, categories, paymentMethods, recurringPayments, transactions} from './db/schema';
import {processRecurringPayments} from './jobs/processRecurringPayments';
import {logger} from './lib/logger';
import {handleError, logRequest, servedBy, setRequestContext} from './middleware';
import {ApiResponse, HTTPStatusCode} from './models';
import {BudgetRouter, CategoryRouter, PaymentMethodRouter, RecurringPaymentRouter, TransactionRouter} from './router';

export const app = express();
const tracer = trace.getTracer(config.service, config.version);

app.use(cors(config.cors));
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
app.use(setRequestContext);
app.use(logRequest);
app.use(bodyParser.json());
app.use(servedBy);

// Set a global error handler for validation errors
setGlobalErrorHandler((errors, _req, res) => {
  ApiResponse.builder()
    .withStatus(HTTPStatusCode.BAD_REQUEST)
    .withMessage('Validation Error')
    .withData(errors)
    .buildAndSend(res);
});

app.get('/', (_, res) => res.redirect('https://budget-buddy.de'));
app.get('/api/me', async (req, res) => {
  ApiResponse.builder<typeof req.context>().withData(req.context).buildAndSend(res);
});
app.delete('/api/me', async (req, res) => {
  const userId = req.context.user?.id;
  if (!userId) {
    ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
    return;
  }
  const span = tracer.startSpan("Deleting user data");
  span.setAttribute("userId", userId);
  await db.transaction(async tx => {
    let tempSpan = span.addEvent("Deleting categories");
    tempSpan.setAttribute("userId", userId);
    const deletedCategories = await tx.delete(categories).where(eq(categories.ownerId, userId));
    logger.info(`Deleted ${deletedCategories.rowCount} categories for user ${userId}`);
    tempSpan.end();

    tempSpan = span.addEvent("Deleting payment methods");
    tempSpan.setAttribute("userId", userId);
    const deletedPaymentMethods = await tx.delete(paymentMethods).where(eq(paymentMethods.ownerId, userId));
    logger.info(`Deleted ${deletedPaymentMethods.rowCount} payment methods for user ${userId}`);
    tempSpan.end();

    tempSpan = span.addEvent("Deleting budgets");
    tempSpan.setAttribute("userId", userId);
    const deletedBudgets = await tx.delete(budgets).where(eq(budgets.ownerId, userId));
    logger.info(`Deleted ${deletedBudgets.rowCount} budgets for user ${userId}`);
    tempSpan.end();

    tempSpan = span.addEvent("Deleting transactions");
    tempSpan.setAttribute("userId", userId);
    const deletedTransactions = await tx.delete(transactions).where(eq(transactions.ownerId, userId));
    logger.info(`Deleted ${deletedTransactions.rowCount} transactions for user ${userId}`);
    tempSpan.end();

    tempSpan = span.addEvent("Deleting recurring payments");
    tempSpan.setAttribute("userId", userId);
    const deletedRecurringPayments = await tx.delete(recurringPayments).where(eq(recurringPayments.ownerId, userId));
    logger.info(`Deleted ${deletedRecurringPayments.rowCount} recurring payments for user ${userId}`);
    tempSpan.end();
  });
  span.end()

  ApiResponse.builder().withMessage('User data deleted successfully').buildAndSend(res);
});
app.use('/api/category', CategoryRouter);
app.use('/api/paymentMethod', PaymentMethodRouter);
app.use('/api/transaction', TransactionRouter);
app.use('/api/recurringPayment', RecurringPaymentRouter);
app.use('/api/budget', BudgetRouter);

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
  logger.info('%s is available under http://localhost:%d', config.service, config.port, {...options});

  const jobName = 'process-recurring-payments';
  const span = tracer.startSpan("Planning jobs: " + jobName);
  cron.schedule('30 1 * * *', processRecurringPayments, {
    name: jobName,
    timezone: config.jobs.timezone,
  });
  logger.info('Scheduled job "%s" to run daily at 01:30 AM (%s timezone)', jobName, config.jobs.timezone, {
    job: jobName,
    schedule: '30 1 * * *',
    timezone: config.jobs.timezone,
  });
  span.end()
});
