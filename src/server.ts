import 'dotenv/config';
import {config} from './config';
import {ELogCategory} from './middleware';

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

import http from 'http';
import express from 'express';
import {Server} from 'socket.io';
import bodyParser from 'body-parser';
import cors from 'cors';
import cron from 'node-cron';
import {type TUser} from '@budgetbuddyde/types';
import {name, version} from '../package.json';
import {checkAuthorizationHeader, logMiddleware} from './middleware';
import {AssetRouter, DividendRouter} from './router';
import {AssetSubscriptionHandler} from './handler';
import {AuthService} from './services';
import {StockStore, logger} from './core';

export const app = express();
export const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    ...config.cors,
    // @ts-ignore
    origin: config.cors.origin[0],
  },
});
app.use(cors(config.cors));
app.use(logMiddleware);
app.use(bodyParser.json());
app.use(checkAuthorizationHeader);

app.use('/v1/asset', AssetRouter);
app.use('/v1/dividend', DividendRouter);

app.get('/', (req, res) => res.redirect('https://budget-buddy.de'));
app.get('/status', (req, res) => res.json({status: 'OK'}));

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const [user, err] = await AuthService.validateAuthHeader(token);
  if (err) {
    logger.warn(err.message, {category: ELogCategory.AUTHENTIFICATION});
    return next(err);
  } else if (!user) {
    const msg = 'No user found';
    logger.warn(msg, {category: ELogCategory.AUTHENTIFICATION});
    return next(new Error(msg));
  }

  logger.info(`Connection authenticated with user ${user.uuid} (${user.email})`, {category: ELogCategory.WEBSOCKET});
  next();
});

io.on('connection', socket => {
  logger.info(`Client (${socket.client.conn.remoteAddress}) connected`, {category: ELogCategory.WEBSOCKET});
  // console.log(socket.rooms);

  socket.on('disconnect', () => {
    logger.info(`Client (${socket.client.conn.remoteAddress}) disconnected`, {category: ELogCategory.WEBSOCKET});
    // console.log('disconnected', socket.rooms);
  });

  // socket.on('disconnecting', () => {
  //   console.log('disconnecting', socket.rooms);
  // });

  socket.on('stock:subscribe', ([stocks, userId]: [{isin: string; exchange: string}[], TUser['uuid']]) => {
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

  socket.on('stock:unsubscribe', ([stocks, userId]: [{isin: string; exchange: string}[], TUser['uuid']]) => {
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

export const listen = server.listen(config.port, process.env.HOSTNAME || 'localhost', () => {
  console.table({
    'Application Name': name,
    'Application Version': version,
    'Runtime Environment': config.environment,
    'Node Version': process.version,
    'Server Port': config.port,
    'Background Jobs': config.enableBackgroundJobs,
  });

  if (config.enableBackgroundJobs) {
    logger.info(`Background jobs are enabled`, {category: ELogCategory.SETUP});
    const assetUpdateInterval = `*/${config.stocks.fetchInterval} * * * *`;
    if (cron.validate(assetUpdateInterval)) {
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
    } else logger.warn(`Invalid cron-expression: ${assetUpdateInterval}`, {category: ELogCategory.BACKGROUND_JOB});

    logger.info(`Scheduled jobs: ${Array.from(cron.getTasks().keys()).join(', ')}`, {
      category: ELogCategory.BACKGROUND_JOB,
    });
  } else logger.warn('Background jobs are disabled', {category: ELogCategory.SETUP});

  // TODO: Retrieve persisted stock-prices from redis-database and store them in StockStore
});
