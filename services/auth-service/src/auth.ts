import {getLogLevel, getTrustedOrigins} from '@budgetbuddyde/utils';
import {betterAuth} from 'better-auth';
import {createAuthMiddleware} from 'better-auth/api';
import {admin, bearer, multiSession, openAPI} from 'better-auth/plugins';
import {type BetterAuthOptions} from 'better-auth/types';
import 'dotenv/config';
import fetch from 'node-fetch';

import {config} from './config';
import {logger} from './core/logger';
import {pool} from './pool';
import {redisClient} from './redis';
import {isCSRFCheckDisabled} from './utils/isCSRFCheckDisabled';

const authLogger = logger.child({label: 'auth'});

const options: BetterAuthOptions = {
  appName: config.appName,
  database: pool,
  secondaryStorage:
    process.env.REDIS_URL !== undefined
      ? {
          get: async key => await redisClient.get(key),
          set: async (key, value, ttl) => {
            if (ttl) await redisClient.set(key, value, {EX: ttl});
            else await redisClient.set(key, value);
          },
          delete: async key => {
            await redisClient.del(key);
          },
        }
      : undefined,
  emailAndPassword: {
    enabled: true,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['email-password', 'github', 'google'],
    },
  },
  socialProviders: {
    github: {
      enabled: true,
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  logger: {
    disabled: false,
    level: getLogLevel(),
    log: (lvl, msg, args) => {
      authLogger[lvl](msg, args);
    },
  },
  hooks: {
    after: createAuthMiddleware(async ctx => {
      const path = ctx.path;
      if (path.startsWith('/sign-up')) {
        const newSession = ctx.context.newSession;
        if (newSession) {
          authLogger.info('New user signed up', newSession);

          const CAPIRE_BACKEND_HOST = process.env.CAPIRE_BACKEND_HOST;
          if (!CAPIRE_BACKEND_HOST) {
            authLogger.error('CAPIRE_BACKEND_HOST is not set! Cannot create user in CAP backend.', {
              CAPIRE_BACKEND_HOST,
              userId: newSession.user.id,
            });
            return;
          }

          const payload = JSON.stringify({userId: newSession.user.id});
          const headers = {
            'Content-Type': 'application/json',
          };
          authLogger.debug('Creating user in CAP backend', {
            payload,
            headers,
            CAPIRE_BACKEND_HOST,
          });
          const response = await fetch(CAPIRE_BACKEND_HOST + '/service/user/User', {
            method: 'POST',
            headers,
            body: payload,
          });
          if (!response.ok) {
            authLogger.error('Failed to create user in CAP backend', {
              status: response.status,
              statusText: response.statusText,
              userId: newSession.user.id,
              CAPIRE_BACKEND_HOST,
            });
            return;
          }
          authLogger.info('User created in CAP backend', {userId: newSession.user.id, CAPIRE_BACKEND_HOST});
        }
      }
    }),
  },
  trustedOrigins: getTrustedOrigins(),
  advanced: {
    crossSubDomainCookies:
      process.env.CROSS_SUB_DOMAIN_COOKIES_DOMAIN !== undefined
        ? {
            enabled: true,
            domain: process.env.CROSS_SUB_DOMAIN_COOKIES_DOMAIN,
          }
        : undefined,
    disableCSRFCheck: isCSRFCheckDisabled(),
    useSecureCookies: config.environment === 'production',
  },
  rateLimit: {
    window: 60,
    max: 30,
  },
  plugins: [bearer(), admin(), openAPI(), multiSession()].filter(v => typeof v !== 'boolean'),
};

export const auth = betterAuth(options);
