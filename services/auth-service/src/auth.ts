import {betterAuth} from 'better-auth';
import {admin, bearer, multiSession, openAPI} from 'better-auth/plugins';
import {type BetterAuthOptions} from 'better-auth/types';
import 'dotenv/config';

import {config} from './config';
import {pool} from './pool';
import {redisClient} from './redis';
import {getTrustedOrigins} from './utils/getTrustedOrigins';
import {isCSRFCheckDisabled} from './utils/isCSRFCheckDisabled';
import {isProdEnv} from './utils/isProdEnv';

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
    level: 'debug',
    // log(level, message, ...args) {
    //   console.log(`[${level}] ${message}`, ...args);
    // },
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
  plugins: [bearer(), admin(), isProdEnv() ? false : openAPI(), multiSession()].filter(v => typeof v !== 'boolean'),
};

export const auth = betterAuth(options);
