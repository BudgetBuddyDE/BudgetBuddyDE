import {LogLevel} from '@budgetbuddyde/logger';
import {type BetterAuthOptions, betterAuth, type Logger} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {openAPI} from 'better-auth/plugins';
import {config} from './config';
import {db} from './db';
import {getRedisClient} from './db/redis';
import * as authSchema from './db/schema/auth.schema';
import {logger} from './lib/logger';
import {resendManager} from './lib/resend';
import {isCSRFCheckDisabled} from './utils';

const {GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET} = process.env;

const authLogger = logger.child({label: 'auth'});

const options: BetterAuthOptions = {
  baseURL: config.runtime === 'production' ? config.baseUrl : `${config.baseUrl}:${config.port}`,
  appName: config.service,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),
  secondaryStorage: process.env.REDIS_URL
    ? {
        set(key, value, ttl) {
          const client = getRedisClient();
          client.set(key, value, 'EX', ttl || 10);
        },
        get(key) {
          const client = getRedisClient();
          return client.get(key);
        },
        delete(key) {
          const client = getRedisClient();
          client.del(key);
        },
      }
    : undefined,
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
        default:
          return authLogger.info(message, args);
      }
    },
  },
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',') || ['http://localhost:3000'],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 30 * 60, // Cache duration in seconds
    },
  },
  advanced: {
    disableCSRFCheck: isCSRFCheckDisabled(),
    useSecureCookies: config.runtime === 'production',
    cookiePrefix: 'budget-buddy',
    crossSubDomainCookies: {
      enabled: true,
      domain: config.runtime === 'production' ? '.budget-buddy.de' : 'localhost',
    },
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    disableSignUp: process.env.DISABLE_SIGNUP === 'true',
    async sendResetPassword({user: {id, email, name}, url}) {
      authLogger.info(`Password reset requested for user: ${email}`, {userId: id});

      const [result, error] = await resendManager.sendPasswordReset(email, name, url);
      if (error) {
        authLogger.error('Error while sending password reset email to %s: %o', email, error);
        return;
      }

      authLogger.info('Password reset email (%s) sent to %s: %o', result.id, email);
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      async sendChangeEmailVerification({user: {id, email}, url, newEmail}, _request) {
        authLogger.info(`Change email verification requested for user: ${email}`, {userId: id});
        const [result, error] = await resendManager.sendChangeEmailRequest(email, newEmail, url);
        if (error) {
          authLogger.error('Error while sending verification email to %s: %o', email, error);
          return;
        }

        authLogger.info('Verification email (%s) sent to %s: %o', result.id, email);
      },
    },
    deleteUser: {
      enabled: true,
      async beforeDelete(user) {
        authLogger.info(`User deletion requested for user: ${user.email}`);
      },
      async sendDeleteAccountVerification({user: {id, email}, url}) {
        authLogger.info(`Delete account requested for user: ${email}`, {userId: id});

        const [result, error] = await resendManager.sendAccountDeletionVerification(email, url);
        if (error) {
          authLogger.error('Error while sending account deletion verification email to %s: %o', email, error);
          return;
        }

        authLogger.info('Account deletion verification email (%s) sent to %s: %o', result.id, email);
      },
      async afterDelete(user) {
        authLogger.info(`User deleted: ${user.email}`);
        authLogger.warn('User deletion handling (for other services)not yet implemented!');
        // TODO: Delete all user data from other services
      },
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    async onEmailVerification({email, emailVerified}) {
      emailVerified
        ? authLogger.info(`Email verified for user: ${email}`)
        : authLogger.error(`Email verification failed for user: ${email}`);
    },
    async sendVerificationEmail({user: {email}, url}, _request) {
      authLogger.info(`Email verification requested for user: ${email}`);
      const [result, error] = await resendManager.sendVerificationEmail(email, url);
      if (error) {
        authLogger.error('Error while sending verification email to %s: %o', email, error);
        return;
      }

      authLogger.info('Verification email (%s) sent to %s: %o', result.id, email);
    },
  },
  account: {
    updateAccountOnSignIn: true,
    accountLinking: {
      enabled: true,
      allowUnlinkingAll: false,
      allowDifferentEmails: false,
      trustedProviders: ['email-password', 'github', 'google'],
    },
  },
  socialProviders: {
    github: {
      enabled: Boolean(GITHUB_CLIENT_ID) && Boolean(GITHUB_CLIENT_SECRET),
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
    default:
      return undefined;
  }
}
