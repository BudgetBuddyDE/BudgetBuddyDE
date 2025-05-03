import {getTrustedOrigins} from '@budgetbuddyde/utils';
import {betterAuth} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {admin, multiSession} from 'better-auth/plugins';
import {type BetterAuthOptions} from 'better-auth/types';
import 'dotenv/config';

import {config} from './config';
import {db} from './db/drizzleClient';
import {redisClient} from './db/redis';
import * as authSchema from './db/schema/auth';
import {isCSRFCheckDisabled} from './utils';

export const auth = betterAuth({
  appName: config.service,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),
  secondaryStorage: {
    get: async key => await redisClient.get(key),
    set: async (key, value, ttl) => {
      if (ttl) await redisClient.set(key, value, {EX: ttl});
      else await redisClient.set(key, value);
    },
    delete: async key => {
      await redisClient.del(key);
    },
  },
  logger: {
    disabled: false,
    level: config.log.level,
    log: config.log.log,
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      enabled: false,
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      enabled: false,
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['email-password', 'github', 'google'],
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
  plugins: [admin({defaultRole: 'user', adminRoles: ['admin', 'service-account']}), multiSession()].filter(
    v => typeof v !== 'boolean',
  ),
} as BetterAuthOptions);
