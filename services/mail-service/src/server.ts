import {ApiResponse, HTTPStatusCode, PocketBaseCollection, type TNewsletter, type TUser} from '@budgetbuddyde/types';
import {ZMailOptInPayload, ZMailOptOutPayload, ZVerifyMailOptInPayload} from '@budgetbuddyde/types/lib/Mail.types';
import bodyParser from 'body-parser';
import cors from 'cors';
import {subDays} from 'date-fns';
import 'dotenv/config';
import express from 'express';
import cron from 'node-cron';
import path from 'node:path';

import {name, version} from '../package.json';
import OptIn from '../transactional/emails/support/opt-in';
import OptInNotification from '../transactional/emails/support/opt-in-notification';
import OptOutNotification from '../transactional/emails/support/opt-out-notification';
import {config} from './config';
import {sendDailyStockReport} from './core/sendDailyStockReport';
import {sendMonthlyReports} from './core/sendMonthlyReports';
import {sendWeeklyReports} from './core/sendWeeklyReports';
import {logger} from './logger';
import {AuthMiddleware, logMiddleware} from './middleware';
import {pb} from './pocketbase';
import {resend} from './resend';
import TriggerRouter from './router/TriggerReport.router';
import {generateRandomId} from './utils';

/**
 * Check if all required environment-variables are set
 */
const MISSING_ENVIRONMENT_VARIABLES = config.environmentVariables.filter(variable => {
  if (!process.env[variable]) {
    return variable;
  }
});
if (MISSING_ENVIRONMENT_VARIABLES.length >= 1) {
  console.log(
    'ERROR',
    JSON.stringify({
      missing: MISSING_ENVIRONMENT_VARIABLES,
      error: 'server/missing-environment-variables',
    }),
  );
  process.exit();
}

const app = express();

app.use('/static', express.static(path.join(__dirname, '../public')));
app.use(logMiddleware);
app.use(cors(config.cors));
app.use(bodyParser.json());
app.use((req, res, next) => {
  const requestId = generateRandomId();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Served-By', `${name}::${version}`);
  next();
});
app.use(AuthMiddleware);
app.use('/trigger', TriggerRouter);

export const NEWSLETTER = {
  WEEKLY_REPORT: '1f9763pp1k8gxx0',
  MONTHLY_REPORT: '4hughmgyyzgkine',
  DAILY_STOCK_REPORT: 'q8uhgles4ywmzoh',
};

app.get('/', (req, res) => res.redirect('https://budget-buddy.de'));
app.get('/status', (req, res) => res.json({status: 'OK'}));

app.post('/opt-in', async (req, res) => {
  const payload = req.body;
  const parsedBody = ZMailOptInPayload.safeParse(payload);
  if (!parsedBody.success) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('Invalid payload').build());
  }

  const {userId, newsletterId} = parsedBody.data;
  const user: TUser = await pb.collection(PocketBaseCollection.USERS).getOne(userId, {cache: 'no-cache'});
  if (!user) {
    return res
      .status(HTTPStatusCode.NotFound)
      .json(
        ApiResponse.builder().withStatus(HTTPStatusCode.NotFound).withMessage(`User '${userId}' not found!`).build(),
      );
  } else if (user && !user.verified) {
    return res
      .status(HTTPStatusCode.BadGateway)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.BadRequest)
          .withMessage(`You need to verify your mail-address first!`)
          .build(),
      );
  }

  const newsletter: TNewsletter = await pb.collection(PocketBaseCollection.NEWSLETTER).getOne(newsletterId);
  if (!newsletter) {
    return res
      .status(HTTPStatusCode.NotFound)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.NotFound)
          .withMessage(`Newsletter '${newsletterId}' not found!`)
          .build(),
      );
  } else if (newsletter && !newsletter.enabled) {
    return res
      .status(HTTPStatusCode.BadGateway)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.BadGateway)
          .withMessage(`Newsletter '${newsletter.newsletter}' not enabled!`)
          .build(),
      );
  }

  if (user.newsletter.includes(newsletterId)) {
    logger.info('User already subscribed to newsletter', newsletterId);
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.BadRequest)
          .withMessage(`User '${userId}' already subscribed to newsletter '${newsletterId}'!`)
          .build(),
      );
  }

  const data = await resend.emails.send({
    from: config.sender,
    to: user.email,
    subject: `Subscribe to ${newsletter.name}`,
    react: OptIn({
      company: config.company,
      name: user.name ?? '',
      newsletter: newsletter.name,
      endpointHost: config.host,
      newsletterId: newsletterId,
      userId: user.id,
    }),
  });
  logger.info(`Mail ${data.data?.id} was send`, data);

  return res.json(
    ApiResponse.builder().withMessage(`You need to verify the newsletter subscription! Look into your inbox.`).build(),
  );
});

app.get('/opt-in/verify', async (req, res) => {
  const query = req.query;
  const parsedPayload = ZVerifyMailOptInPayload.safeParse({
    userId: query.userId,
    newsletterId: query.newsletterId,
  });
  if (!parsedPayload.success) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('Invalid payload').build());
  }
  const {userId, newsletterId} = parsedPayload.data;
  const user: TUser = await pb.collection(PocketBaseCollection.USERS).getOne(userId, {cache: 'no-cache'});
  if (!user) {
    return res
      .status(HTTPStatusCode.NotFound)
      .json(
        ApiResponse.builder().withStatus(HTTPStatusCode.NotFound).withMessage(`User '${userId}' not found!`).build(),
      );
  } else if (user && !user.verified) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.BadGateway)
          .withMessage(`You need to verify your mail-address first!`)
          .build(),
      );
  }

  const newsletter: TNewsletter = await pb.collection(PocketBaseCollection.NEWSLETTER).getOne(newsletterId);
  if (!newsletter) {
    return res
      .status(HTTPStatusCode.NotFound)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.NotFound)
          .withMessage(`Newsletter '${newsletterId}' not found!`)
          .build(),
      );
  } else if (newsletter && !newsletter.enabled) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.BadRequest)
          .withMessage(`Newsletter '${newsletter.newsletter}' not enabled!`)
          .build(),
      );
  }

  if (user.newsletter.includes(newsletterId)) {
    logger.info('User already subscribed to newsletter', {newsletterId, userId});
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.BadRequest)
          .withMessage(`User '${userId}' already subscribed to newsletter '${newsletterId}'!`)
          .build(),
      );
  }

  const data = await resend.emails.send({
    from: config.sender,
    to: user.email,
    subject: `Subscribed to ${newsletter.name}`,
    react: OptInNotification({company: config.company, name: user.name ?? 'Buddy', newsletter: newsletter.name}),
  });
  logger.info(`Mail ${data.data?.id} was send`, data);

  // https://pocketbase.io/docs/working-with-relations#append-to-multiple-relation
  const updatedUser: TUser = await pb.collection(PocketBaseCollection.USERS).update(userId, {
    'newsletter+': newsletterId,
  });
  logger.info("Added newsletter to user's subscriptions", {newsletterId, userId});

  return res.json(
    ApiResponse.builder().withMessage(`Subscribed to the ${newsletter.name}-newsletter!`).withData(updatedUser).build(),
  );
});

app.post('/opt-out', async (req, res) => {
  const payload = await req.body;
  const parsedBody = ZMailOptOutPayload.safeParse(payload);
  if (!parsedBody.success) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('Invalid payload').build());
  }

  const {userId, newsletterId} = parsedBody.data;
  const user: TUser = await pb.collection(PocketBaseCollection.USERS).getOne(userId);
  if (!user) {
    return res
      .status(HTTPStatusCode.NotFound)
      .json(
        ApiResponse.builder().withStatus(HTTPStatusCode.NotFound).withMessage(`User '${userId}' not found!`).build(),
      );
  } else if (user && !user.verified) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.BadRequest)
          .withMessage(`You need to verify your mail-address first!`)
          .build(),
      );
  }

  const newsletter: TNewsletter = await pb.collection(PocketBaseCollection.NEWSLETTER).getOne(newsletterId);
  if (!newsletter) {
    return res
      .status(HTTPStatusCode.NotFound)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.NotFound)
          .withMessage(`Newsletter '${newsletterId}' not found!`)
          .build(),
      );
  }

  if (!user.newsletter.includes(newsletterId)) {
    logger.info('User not subscribed to newsletter', {newsletterId, userId});
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.BadRequest)
          .withMessage(`User '${userId}' not subscribed to newsletter '${newsletterId}'!`)
          .build(),
      );
  }

  const data = await resend.emails.send({
    from: config.sender,
    to: user.email,
    subject: `Subscribed to ${newsletter.name}`,
    react: OptOutNotification({company: config.company, name: user.name ?? 'Buddy', newsletter: newsletter.name}),
  });
  logger.info(`Mail ${data.data?.id} was send`, data);

  // https://pocketbase.io/docs/working-with-relations#append-to-multiple-relation
  const updatedUser: TUser = await pb.collection(PocketBaseCollection.USERS).update(userId, {
    'newsletter-': newsletterId,
  });
  logger.info("Remove newsletter from user's subscriptions", {newsletterId, userId});

  return res.json(
    ApiResponse.builder()
      .withMessage(`Unsubscribed from the ${newsletter.name}-newsletter!`)
      .withData(updatedUser)
      .build(),
  );
});

export const listen = app.listen(config.port, process.env.HOSTNAME || 'localhost', async () => {
  console.table({
    'Application Name': name,
    'Application Version': version,
    'Runtime Environment': config.environment,
    'Node Version': process.version,
    'Server Port': config.port,
  });

  if (config.environment !== 'test') {
    try {
      const {SERVICE_ACCOUNT_EMAIL, SERVICE_ACCOUNT_PASSWORD} = process.env;
      if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PASSWORD) {
        throw new Error('SERVICE_ACCOUNT_EMAIL or SERVICE_ACCOUNT_PASSWORD is not set!');
      }
      const authStatus = await pb.admins.authWithPassword(SERVICE_ACCOUNT_EMAIL, SERVICE_ACCOUNT_PASSWORD);

      logger.info(
        'Successfully authenticated as a admin-account against Pocketbase! Account: ' + authStatus.admin.email,
        {
          session: authStatus,
        },
      );
    } catch (error) {
      const err = error as Error;
      logger.error(`Wasn't able to verify as a admin-account against Pocketbase! Reason: ${err.message}`, {
        target: process.env.POCKETBASE_URL,
        email: process.env.SERVICE_ACCOUNT_EMAIL,
        name: err.name,
        error: err.message,
        stack: err.stack,
      });
    }

    cron.schedule(
      '0 6 * * 1-5',
      async () => {
        logger.debug("Running 'TriggerDailyStockReport' job");
        const [_, error] = await sendDailyStockReport(NEWSLETTER.DAILY_STOCK_REPORT);
        if (error) {
          logger.error('Was not able to send daily stock reports!', error);
          return;
        }
        logger.info('Daily stock reports were sent!');
      },
      {name: 'TriggerDailyStockReport'},
    );

    cron.schedule(
      '0 6 * * 1',
      async () => {
        logger.debug("Running 'TriggerWeeklyReports' job");
        const startDate = subDays(new Date(), 7);
        const endDate = new Date();
        const [_, error] = await sendWeeklyReports(NEWSLETTER.WEEKLY_REPORT, startDate, endDate);
        if (error) {
          logger.error('Was not able to send weekly reports', error);
          return;
        }
        logger.info('Weekly reports were sent', {startDate, endDate});
      },
      {name: 'TriggerWeeklyReports'},
    );

    cron.schedule(
      '0 6 1 * *',
      async () => {
        logger.debug("Running 'TriggerMonthlyReports' job");
        const month = new Date();
        const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
        const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        const [_, error] = await sendMonthlyReports(NEWSLETTER.MONTHLY_REPORT, month, startDate, endDate);
        if (error) {
          logger.error('Was not able to send weekly reports', error);
          return;
        }
        logger.info('Monthly reports were sent', {month, startDate, endDate});
      },
      {name: 'TriggerMonthlyReports'},
    );

    logger.info(`Scheduled jobs: ${Array.from(cron.getTasks().keys()).join(', ')}`);
  } else {
    logger.debug("The application is running in 'test'-mode. No scheduled jobs will be started.");
  }

  logger.info(`The application is available under ${process.env.HOST || 'http://localhost:' + config.port}`, {
    host: process.env.HOST,
    port: config.port,
  });
});
