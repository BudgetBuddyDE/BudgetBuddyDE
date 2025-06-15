import {getTrustedOrigins} from '@budgetbuddyde/utils';
import {betterAuth} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {createAuthMiddleware} from 'better-auth/api';
import {admin, bearer, multiSession, openAPI} from 'better-auth/plugins';
import {type BetterAuthOptions} from 'better-auth/types';
import 'dotenv/config';
import fetch from 'node-fetch';

import {config} from './config';
import {logger} from './core/logger';
import {db} from './db/drizzleClient';
import {redisClient} from './db/redis';
import * as authSchema from './db/schema/auth';
import {isCSRFCheckDisabled} from './utils/isCSRFCheckDisabled';

export enum AuthRole {
  USER = 'user',
  SERVICE_ACCOUNT = 'service-account',
  ADMIN = 'admin',
}

export function isUserRole(role: string | null): asserts role is AuthRole {
  const isUserRole = Object.values(AuthRole).includes(role as AuthRole);
  if (!isUserRole) {
    throw new Error(`Role ${role} is not a valid user role`);
  }
}

const authLogger = logger.child({label: 'auth'});

const options: BetterAuthOptions = {
  appName: config.service,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),
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
  logger: {
    disabled: false,
    level: config.log.level,
    log: config.log.log,
  },
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
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
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
  plugins: [
    bearer(),
    admin({defaultRole: AuthRole.USER, adminRoles: [AuthRole.ADMIN, AuthRole.SERVICE_ACCOUNT]}),
    openAPI(),
    multiSession(),
  ].filter(v => typeof v !== 'boolean'),
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
              responseBody: await response.text(),
            });
            return;
          }
          authLogger.info('User created in CAP backend', {userId: newSession.user.id, CAPIRE_BACKEND_HOST});
        }
      }
    }),
  },
};

export const auth = betterAuth(options);
