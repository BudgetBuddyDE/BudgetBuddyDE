import {getTrustedOrigins} from '@budgetbuddyde/utils';
import {type BetterAuthOptions, betterAuth} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {createAuthMiddleware, openAPI} from 'better-auth/plugins';

import {config} from './config';
import {db} from './db';
import * as authSchema from './db/schema/auth.schema';
import {isCSRFCheckDisabled} from './utils';

const {GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET} = process.env;

const options: BetterAuthOptions = {
  baseURL: `${config.baseUrl}:${config.port}`,
  appName: config.service,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),
  logger: {
    disabled: false,
    level: config.log.level,
    log: config.log.log,
  },
  trustedOrigins: getTrustedOrigins(),
  advanced: {
    disableCSRFCheck: isCSRFCheckDisabled(),
    useSecureCookies: config.runtime == 'production',
    cookiePrefix: '',
    crossSubDomainCookies: {
      enabled: true,
    },
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['email-password', 'github', 'google'],
    },
  },
  socialProviders: {
    github: {
      enabled: Boolean(GITHUB_CLIENT_ID) && Boolean(GITHUB_CLIENT_SECRET), // TODO: Write test to ensure that Boolean(ENV) will always return true if the env var is set
      clientId: GITHUB_CLIENT_ID as string,
      clientSecret: GITHUB_CLIENT_SECRET as string,
    },
    google: {
      enabled: Boolean(GOOGLE_CLIENT_ID) && Boolean(GOOGLE_CLIENT_SECRET),
      clientId: GOOGLE_CLIENT_ID as string,
      clientSecret: GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [config.runtime === 'development' ? openAPI() : null].filter(p => p !== null),
  hooks: {
    after: createAuthMiddleware(async ctx => {
      if (ctx.path.startsWith('/sign-up')) {
        const newSession = ctx.context.newSession;
        if (newSession) {
          // TODO: Implement user replication to the backend
        }
      }
    }),
  },
};

export const auth = betterAuth(options);
