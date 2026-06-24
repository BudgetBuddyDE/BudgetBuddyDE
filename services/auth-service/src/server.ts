import type {Entity, EntityOperation, PermissionConfig} from '@budgetbuddyde/api/auth';
import {fromNodeHeaders, toNodeHandler} from 'better-auth/node';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import {auth} from './auth';
import {config} from './config';
import {checkConnection} from './db';
import {getRedisClient} from './db/redis';
import {logger} from './lib/logger';
import {handleError, log, servedBy} from './middleware';
import {ApiResponse, HTTPStatusCode} from './models';

export const app = express();

app.use(cors(config.cors));
if (config.runtime === 'production') {
  app.use(
    rateLimit({
      ...config.rateLimit,
      store: new RedisStore({
        prefix: `rate-limit:${config.service}:`,
        // biome-ignore lint/suspicious/noExplicitAny: ioredis returns unknown, rate-limit-redis expects RedisReply
        sendCommand: (...args: string[]) => getRedisClient().call(...(args as [string, ...string[]])) as any,
      }),
    }),
  );
  logger.info('Rate limiting is enabled in production environment.');
} else
  logger.warn(
    'Rate limiting is disabled in non-production environments. Make sure to enable it in production to prevent abuse.',
  );
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
app.use(log);
app.use(servedBy);

app.post('/api/auth/api-key/create-with-permissions', express.json(), async (req, res, next) => {
  try {
    if (!isTrustedOrigin(req.get('origin'))) {
      res.status(HTTPStatusCode.FORBIDDEN).json({message: 'Untrusted request origin'});
      return;
    }

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      res.status(HTTPStatusCode.UNAUTHORIZED).json({message: 'A valid session is required'});
      return;
    }

    const body = parseCreateApiKeyBody(req.body);
    if (!body) {
      res.status(HTTPStatusCode.BAD_REQUEST).json({message: 'Invalid API key configuration'});
      return;
    }

    const apiKey = await auth.api.createApiKey({
      body: {
        userId: session.user.id,
        name: body.name,
        permissions: body.permissions,
        ...(body.expiresIn === undefined ? {} : {expiresIn: body.expiresIn}),
      },
    });
    res.status(HTTPStatusCode.CREATED).json(apiKey);
  } catch (error) {
    next(error);
  }
});

// Returns a 404
// app.get('/', (_, res) => res.redirect('https://budget-buddy.de'));
app.all('/api/auth/{*splat}', toNodeHandler(auth));
app.get('/api/me', async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  res.json(session);
});

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
  logger.info('%s is available under http://localhost:%d', config.service, config.port, options);
});

type CreateApiKeyBody = {
  name: string;
  expiresIn?: number;
  permissions: PermissionConfig;
};

const ENTITIES: Entity[] = ['transaction', 'recurringPayment', 'budget', 'category', 'paymentMethod'];
const ENTITY_OPERATIONS: EntityOperation[] = ['read', 'write'];

function parseCreateApiKeyBody(value: unknown): CreateApiKeyBody | null {
  if (!isRecord(value) || typeof value.name !== 'string' || value.name.trim().length === 0) {
    return null;
  }
  if (value.expiresIn !== undefined && (typeof value.expiresIn !== 'number' || value.expiresIn <= 0)) {
    return null;
  }
  if (!isPermissionConfig(value.permissions)) {
    return null;
  }

  return {
    name: value.name.trim(),
    permissions: value.permissions,
    ...(value.expiresIn === undefined ? {} : {expiresIn: value.expiresIn}),
  };
}

function isPermissionConfig(value: unknown): value is PermissionConfig {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(
    ([entity, operations]) =>
      ENTITIES.includes(entity as Entity) &&
      Array.isArray(operations) &&
      operations.length > 0 &&
      operations.every(operation => ENTITY_OPERATIONS.includes(operation as EntityOperation)),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTrustedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return false;
  }

  const allowedOrigins = config.cors.origin;
  if (typeof allowedOrigins === 'string') {
    return allowedOrigins === origin;
  }
  if (allowedOrigins instanceof RegExp) {
    return allowedOrigins.test(origin);
  }
  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.some(allowed => (allowed instanceof RegExp ? allowed.test(origin) : allowed === origin));
  }

  return allowedOrigins === true;
}
