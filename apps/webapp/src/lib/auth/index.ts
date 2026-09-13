import {apiKey} from '@better-auth/api-key';
import * as authSchema from '@budgetbuddyde/db/auth';
import {type BetterAuthOptions, betterAuth, type Logger} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {openAPI} from 'better-auth/plugins';
import {logger} from '@/logger';
import {getAuthConfig, type AuthConfig} from './config';
import {getAuthDatabase} from './db';
import {ResendManager} from './resend';

const authLogger = logger.child({module: 'auth'});

export function mapLogLevelForBetterAuth(level: AuthConfig['log']['level']): Logger['level'] {
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

function createAuth() {
  const config = getAuthConfig();
  const resendManager = new ResendManager(config);

  const options: BetterAuthOptions = {
    secret: config.secret,
    baseURL: config.baseUrl,
    appName: config.service,
    database: drizzleAdapter(getAuthDatabase().db, {
      provider: 'pg',
      schema: authSchema,
    }),
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
    trustedOrigins: config.trustedOrigins,
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 30 * 60, // Cache duration in seconds
      },
    },
    rateLimit: {
      enabled: config.runtime === 'production',
      window: 5 * 60,
      max: 500,
      storage: 'memory',
    },
    advanced: {
      disableCSRFCheck: config.disableCsrfCheck,
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
      disableSignUp: config.disableSignUp,
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
        enabled: Boolean(config.socialProviders.github.clientId) && Boolean(config.socialProviders.github.clientSecret),
        clientId: config.socialProviders.github.clientId as string,
        clientSecret: config.socialProviders.github.clientSecret as string,
      },
      google: {
        enabled: Boolean(config.socialProviders.google.clientId) && Boolean(config.socialProviders.google.clientSecret),
        clientId: config.socialProviders.google.clientId as string,
        clientSecret: config.socialProviders.google.clientSecret as string,
      },
    },
    plugins: [
      apiKey({
        defaultPrefix: 'bb-',
        enableSessionForAPIKeys: true,
        requireName: true,
        rateLimit: {
          enabled: true,
          maxRequests: 250,
          timeWindow: 5 * 60 * 1000,
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

  return betterAuth(options);
}

type AuthInstance = ReturnType<typeof betterAuth>;

let authInstance: AuthInstance | undefined;

/**
 * Returns the singleton Better Auth instance, creating it lazily on first use.
 * Lazy creation keeps `next build` from requiring runtime secrets.
 */
export function getAuth(): AuthInstance {
  if (!authInstance) {
    authInstance = createAuth();
  }
  return authInstance;
}

export {getAuthConfig} from './config';
export {getAuthDatabase} from './db';
