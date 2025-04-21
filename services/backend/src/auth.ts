import {getTrustedOrigins} from '@budgetbuddyde/utils';
import {betterAuth} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {multiSession} from 'better-auth/plugins';

import {config} from './config';
import {db} from './db/drizzleClient';
import {isCSRFCheckDisabled} from './utils';

export const auth = betterAuth({
  appName: config.service,
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
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
  plugins: [multiSession()].filter(v => typeof v !== 'boolean'),
});
