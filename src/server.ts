import {type TUser} from '@budgetbuddyde/types';
import bodyParser from 'body-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import http from 'http';
import cron from 'node-cron';
import {Server} from 'socket.io';

import {name, version} from '../package.json';
import {config} from './config';
import {StockStore, logger} from './core';
import {AssetSubscriptionHandler} from './handler';
import {ELogCategory} from './middleware';
import {checkAuthorizationHeader, logMiddleware} from './middleware';
import {pb} from './pocketbase';
import {AssetRouter, AssetWatchlistRouter, DividendRouter, MetalRouter} from './router';
import {AuthService} from './services';
import {isRunningInProduction} from './utils';

/**
 * Check if all required environment-variables are set
 */
const MISSING_ENVIRONMENT_VARIABLES = config.environmentVariables.filter(variable => {
  if (!process.env[variable]) {
    return variable;
  }
});
if (MISSING_ENVIRONMENT_VARIABLES.length >= 1) {
  console.error('error', `Missing environment-variables: ${MISSING_ENVIRONMENT_VARIABLES.join(', ')}`);
  process.exit(1);
}

export const app = express();
export const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    ...config.cors,
    origin: isRunningInProduction()
      ? ['https://app.budget-buddy.de', 'https://dev.app.budget-buddy.de', /\.budget-buddy\.de$/]
      : ['http://localhost:3000'],
  },
});

app.use(cors(config.cors));
app.use(logMiddleware);
app.use(bodyParser.json());
app.use(checkAuthorizationHeader);
app.use((req, res, next) => {
  res.setHeader('X-Served-By', `${name}::${version}`);
  next();
});

app.use('/v1/asset', AssetRouter);
app.use('/v1/asset/watchlist', AssetWatchlistRouter);
app.use('/v1/dividend', DividendRouter);
app.use('/v1/metal', MetalRouter);

app.get('/', (req, res) => res.redirect('https://budget-buddy.de'));
app.get('/status', (req, res) => res.json({status: 'OK'}));

io.engine.on('headers', (headers, req) => {
  headers['X-Served-By'] = `${name}::${version}`;
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const userId = socket.handshake.auth.userId;
  const [user, err] = await AuthService.verifyToken(token.split('Bearer')[1].trimStart(), userId);
  if (err) {
    logger.warn(err.message, {category: ELogCategory.AUTHENTIFICATION});
    return next(err);
  } else if (!user) {
    const msg = 'No user found';
    logger.warn(msg, {category: ELogCategory.AUTHENTIFICATION});
    return next(new Error(msg));
  }

  logger.info(`Connection authenticated with user ${user.id} (${user.email})`, {category: ELogCategory.WEBSOCKET});
  next();
});

io.on('connection', socket => {
  logger.info(`Client (${socket.client.conn.remoteAddress}) connected`, {category: ELogCategory.WEBSOCKET});

  socket.on('disconnect', () => {
    logger.info(`Client (${socket.client.conn.remoteAddress}) disconnected`, {category: ELogCategory.WEBSOCKET});
  });

  socket.on('stock:subscribe', (stocks: {isin: string; exchange: string}[], userId: NonNullable<TUser>['id']) => {
    logger.info(`Subscribing to stocks ${stocks.map(({isin}) => isin).join(', ')} for client ${userId}`, {
      category: ELogCategory.STOCK,
    });
    StockStore.setState(state => {
      state.addSubscription(
        stocks.map(({isin, exchange}) => ({isin, exchange})),
        userId,
      );
      return state;
    });
  });

  socket.on('stock:unsubscribe', (stocks: {isin: string; exchange: string}[], userId: NonNullable<TUser>['id']) => {
    logger.info(`Remove subscription from stocks ${stocks.map(({isin}) => isin).join(', ')} for client ${userId}`, {
      category: ELogCategory.STOCK,
    });
    StockStore.setState(state => {
      state.removeSubscription(
        stocks.map(({isin, exchange}) => ({isin, exchange})),
        userId,
      );
      return state;
    });
  });
});

export const listen = server.listen(config.port, process.env.HOSTNAME || 'localhost', async () => {
  console.table({
    'Application Name': name,
    'Application Version': version,
    'Runtime Environment': config.environment,
    'Node Version': process.version,
    'Server Port': config.port,
    'Background Jobs': config.enableBackgroundJobs,
    'Bearer Token': process.env.BEARER_TOKEN_SECRET,
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
          category: ELogCategory.POCKETBASE,
        },
      );
    } catch (error) {
      const err = error as Error;
      logger.error(`Wasn't able to verify as a admin-account against Pocketbase! Reason: ${err.message}`, {
        name: err.name,
        error: err.message,
        stack: err.stack,
        category: ELogCategory.POCKETBASE,
      });
    }
  }

  logger.info('The application is available under http://localhost:{port}', {
    category: ELogCategory.SETUP,
    port: config.port,
  });

  if (config.enableBackgroundJobs) {
    logger.info(`Background jobs are enabled`, {category: ELogCategory.SETUP});
    const assetUpdateInterval = `*/${config.stocks.fetchInterval} * * * *`;
    if (!cron.validate(assetUpdateInterval)) {
      return logger.warn(`Invalid cron-expression: ${assetUpdateInterval}`, {category: ELogCategory.BACKGROUND_JOB});
    }

    cron.schedule(
      assetUpdateInterval,
      async () => {
        const subscriptionUpdateDetails = await AssetSubscriptionHandler.UpdateAssetSubscriptions();
        if (subscriptionUpdateDetails.length > 0) {
          for (const {exchange, isin, quote, subscribers} of subscriptionUpdateDetails) {
            for (const subClientId of subscribers) {
              io.emit('stock:update:' + subClientId, {exchange, isin, quote});
            }
          }
        }
      },
      {name: 'AssetSubscriptionHandler.UpdateAssetSubscriptions'},
    );

    logger.info(`Scheduled jobs: ${Array.from(cron.getTasks().keys()).join(', ')}`, {
      category: ELogCategory.BACKGROUND_JOB,
    });
  } else logger.warn('Background jobs are disabled', {category: ELogCategory.SETUP});

  // TODO: Retrieve persisted stock-prices from redis-database and store them in StockStore

  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    function bytesToMB(bytes: number) {
      return (bytes / 1024 / 1024).toFixed(2);
    }
    logger.debug('Memory usage', {
      rss: bytesToMB(memoryUsage.rss),
      heapTotal: bytesToMB(memoryUsage.heapTotal),
      heapUsed: bytesToMB(memoryUsage.heapUsed),
      external: bytesToMB(memoryUsage.external),
      arrayBuffers: bytesToMB(memoryUsage.arrayBuffers),
    });
  }, 30 * 1000);
});
