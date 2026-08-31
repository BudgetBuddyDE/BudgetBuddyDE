import {apiKey} from '@better-auth/api-key';
import * as authSchema from '@budgetbuddyde/db/auth';
import {type BetterAuthOptions, betterAuth, type Logger} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {openAPI} from 'better-auth/plugins';
import {config} from './config';
import {db} from './db';
import {getRedisClient} from './db/redis';
import {logger} from './lib/logger';
import {resendManager} from './lib/resend';

const authLogger = logger.child({module: 'auth'});

const options: BetterAuthOptions = {
  secret: config.auth.secret,
  baseURL: config.runtime === 'production' ? config.baseUrl : `${config.baseUrl}:${config.port}`,
  appName: config.service,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),
  secondaryStorage: config.redis.url
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
    log: (level, message, ...args) => {
      switch (level) {
        case 'debug':
          return authLogger.debug(message, ...args);
        case 'warn':
          return authLogger.warn(message, ...args);
        case 'error':
          return authLogger.error(message, ...args);
        default:
          return authLogger.info(message, ...args);
      }
    },
  },
  trustedOrigins: config.auth.trustedOrigins,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 30 * 60, // Cache duration in seconds
    },
  },
  advanced: {
    disableCSRFCheck: config.auth.disableCsrfCheck,
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
    disableSignUp: config.auth.disableSignUp,
    async sendResetPassword({user: {id, email, name}, url}) {
      authLogger.info(`Password reset requested for user: ${email}`, {userId: id});

      const [result, error] = await resendManager.sendPasswordReset(email, name, url);
      if (error) {
        authLogger.error('Error while sending password reset email to %s', email, error);
        return;
      }

      authLogger.info('Password reset email (%s) sent to %s', result.id, email);
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      // Do not allow users to update their email without verification to prevent account takeover by changing the email to an email they control
      updateEmailWithoutVerification: false,
      async sendChangeEmailConfirmation({user: {id, email}, url, newEmail}, _request) {
        authLogger.info(`Change email verification requested for user: ${email}`, {userId: id});
        const [result, error] = await resendManager.sendChangeEmailRequest(email, newEmail, url);
        if (error) {
          authLogger.error('Error while sending verification email to %s', email, error);
          return;
        }

        authLogger.info('Verification email (%s) sent to %s', result.id, email);
      },
    },
    deleteUser: {
      enabled: true,
      async sendDeleteAccountVerification({user: {id, email}, url}) {
        authLogger.info(`Delete account requested for user: ${email}`, {userId: id});

        const [result, error] = await resendManager.sendAccountDeletionVerification(email, url);
        if (error) {
          authLogger.error('Error while sending account deletion verification email to %s', email, error);
          return;
        }

        authLogger.info('Account deletion verification email (%s) sent to %s', result.id, email);
      },
      async afterDelete(user) {
        authLogger.info(`User deleted: ${user.email}`);
        // TODO: Delete all user data from other services
      },
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendOnSignIn: true,
    async afterEmailVerification(user, _request) {
      // TODO: Send mail after email verification
      user.emailVerified
        ? authLogger.info(`Email verified for user: ${user.email}`)
        : authLogger.error(`Email verification failed for user: ${user.email}`);
    },
    async sendVerificationEmail({user: {email}, url}, _request) {
      authLogger.info(`Email verification requested for user: ${email}`);
      const [result, error] = await resendManager.sendVerificationEmail(email, url);
      if (error) {
        authLogger.error('Error while sending verification email to %s', email, error);
        return;
      }

      authLogger.info('Verification email (%s) sent to %s', result.id, email);
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
      enabled:
        Boolean(config.auth.socialProviders.github.clientId) &&
        Boolean(config.auth.socialProviders.github.clientSecret),
      clientId: config.auth.socialProviders.github.clientId as string,
      clientSecret: config.auth.socialProviders.github.clientSecret as string,
    },
    google: {
      enabled:
        Boolean(config.auth.socialProviders.google.clientId) &&
        Boolean(config.auth.socialProviders.google.clientSecret),
      clientId: config.auth.socialProviders.google.clientId as string,
      clientSecret: config.auth.socialProviders.google.clientSecret as string,
    },
  },
  plugins: [
    apiKey({
      defaultPrefix: 'bb-',
      enableSessionForAPIKeys: true,
      requireName: true,
      rateLimit: {
        enabled: true,
        maxRequests: (config.rateLimit.options.limit as number) / 2,
        timeWindow: config.rateLimit.options.windowMs,
      },
      permissions: {
        // TODO: Implement proper permissions for API keys, e.g. by allowing users to select permissions when creating an API key and storing them in the database
        defaultPermissions(_referenceId, _ctx) {
          // referenceId is either userId or orgId depending on config
          // Fetch user/org role or other data to determine permissions
          return {};
        },
      },
    }),
    config.runtime === 'development' ? openAPI() : null,
  ].filter(p => p !== null),
};

export const auth = betterAuth(options);

export function mapLogLevelForBetterAuth(level: typeof config.log.level): Logger['level'] {
  switch (level) {
    case 'trace':
    case 'debug':
      return 'debug';
    case 'info':
      return 'info';
    case 'warn':
      return 'warn';
    case 'error':
    case 'silent':
      return 'error';
    default:
      return undefined;
  }
}
