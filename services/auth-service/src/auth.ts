import {LogLevel, getTrustedOrigins} from '@budgetbuddyde/utils';
import {type BetterAuthOptions, type Logger, betterAuth} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {createAuthMiddleware, openAPI} from 'better-auth/plugins';

import {config} from './config';
import {logger} from './core/logger';
import {db} from './db';
import * as authSchema from './db/schema/auth.schema';
import {isCSRFCheckDisabled} from './utils';

const {GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET} = process.env;

const authLogger = logger.child({scope: 'auth'});

const options: BetterAuthOptions = {
  baseURL: `${config.baseUrl}:${config.port}`,
  appName: config.service,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),
  logger: {
    disabled: false,
    level: mapLogLevelForBetterAuth(config.log.level),
    log: (level, message, args) => {
      switch (level) {
        case 'debug':
          return authLogger.debug(message, args);
        case 'warn':
          return authLogger.warn(message, args);
        case 'error':
          return authLogger.error(message, args);
        case 'info':
        default:
          return authLogger.info(message, args);
      }
    },
  },
  trustedOrigins: getTrustedOrigins(),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 0.5 * 60, // Cache duration in seconds
    },
  },
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

export function mapLogLevelForBetterAuth(level: typeof config.log.level): Logger['level'] {
  switch (level) {
    case LogLevel.DEBUG:
      return 'debug';
    case LogLevel.INFO:
      return 'info';
    case LogLevel.WARN:
      return 'warn';
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      return 'error';
    case LogLevel.SILENT:
    default:
      return undefined;
  }
}
