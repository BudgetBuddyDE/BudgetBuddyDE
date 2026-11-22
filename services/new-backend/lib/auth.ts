import {apiKey} from '@better-auth/api-key';
import * as authSchema from '@budgetbuddyde/db/auth';
import {preferences} from '@budgetbuddyde/db/backend';
import {betterAuth, type BetterAuthOptions} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {openAPI} from 'better-auth/plugins';
import Redis from 'ioredis';
import {normalizeKey} from 'unstorage';
import {BackendConfig} from './config';
import {getDatabase} from './database';
import {logger} from './logger';
import {sendEmail} from './resend';

const authLogger = logger.child({module: 'auth'});

function sendLink(to: string, subject: string, url: string) {
  return sendEmail({to, subject, text: `${subject}: ${url}`});
}

// Reuse the mounted client for atomic commands that Nitro's KV API does not expose.
function authRedis(): Redis {
  const client: unknown = useStorage().getMount('auth').driver.getInstance?.();
  if (!(client instanceof Redis)) throw new Error('Auth Redis mount is unavailable');
  return client;
}

const secondaryStorage = {
  async get(key) {
    // Unlike getItem, getItemRaw does not parse Better Auth's JSON strings.
    const value: unknown = await useStorage('auth').getItemRaw(key);
    if (value !== null && typeof value !== 'string') throw new Error('Invalid auth session storage value');
    return value;
  },
  set: (key, value, ttl) => useStorage('auth').setItemRaw(key, value, {ttl: ttl || 10}),
  delete: key => useStorage('auth').removeItem(key),
  getAndDelete: key => authRedis().getdel(normalizeKey(key)),
  async increment(key, ttl) {
    const count: unknown = await authRedis().eval(
      `if redis.call('SET', KEYS[1], '1', 'EX', ARGV[1], 'NX') then return 1 end
       return redis.call('INCR', KEYS[1])`,
      1,
      normalizeKey(key),
      ttl,
    );
    if (typeof count !== 'number') throw new Error('Invalid Redis counter result');
    return count;
  },
} satisfies NonNullable<BetterAuthOptions['secondaryStorage']>;

function createAuth() {
  const config = BackendConfig.getInstance();
  const {secret, baseUrl, trustedOrigins, disableSignUp, github, google} = config.auth;
  const logLevel = config.logging.level;
  const db = getDatabase();
  return betterAuth({
  appName: '@budgetbuddyde/backend', secret, baseURL: baseUrl, basePath: '/api/auth',
  trustedOrigins: [...trustedOrigins],
  database: drizzleAdapter(db, {provider: 'pg', schema: authSchema}),
  secondaryStorage: config.redis.auth ? secondaryStorage : undefined,
  logger: {
    disabled: logLevel === 'silent',
    level: logLevel === 'trace' ? 'debug' : logLevel === 'silent' ? 'error' : logLevel,
    log(level, message) {
      // Better Auth diagnostics may include request URLs or sensitive details in their arguments.
      authLogger[level](message.replace(/\b[a-z][\w+.-]*:\/\/[^\s"'<>]+/gi, '[REDACTED URL]'));
    },
  },
  databaseHooks: {user: {create: {async after(user) {
    try {
      await db.insert(preferences).values({ownerId: user.id, onboardingCompleted: false}).onConflictDoNothing({target: preferences.ownerId});
    } catch {
      authLogger.error('Could not initialize preferences for newly registered user');
    }
  }}}},
  session: {cookieCache: {enabled: true, maxAge: 30 * 60}},
  advanced: {
    cookiePrefix: 'budget-buddy', useSecureCookies: config.production,
    crossSubDomainCookies: {enabled: true, domain: config.production ? '.budget-buddy.de' : 'localhost'},
    defaultCookieAttributes: {sameSite: 'none', secure: true},
  },
  emailAndPassword: {
    enabled: true, autoSignIn: true, requireEmailVerification: false, revokeSessionsOnPasswordReset: true,
    disableSignUp,
    sendResetPassword: ({user, url}) => sendLink(user.email, 'Reset your password', url),
  },
  emailVerification: {autoSignInAfterVerification: true, sendOnSignUp: true, sendOnSignIn: true,
    sendVerificationEmail: ({user, url}) => sendLink(user.email, 'Verify your email address', url)},
  user: {
    changeEmail: {enabled: true, updateEmailWithoutVerification: false,
      sendChangeEmailConfirmation: ({user, url}) => sendLink(user.email, 'Confirm change of email address', url)},
    deleteUser: {enabled: true,
      sendDeleteAccountVerification: ({user, url}) => sendLink(user.email, 'Confirm account deletion', url)},
  },
  account: {updateAccountOnSignIn: true, accountLinking: {enabled: true, allowUnlinkingAll: false,
    allowDifferentEmails: false, trustedProviders: ['email-password', 'github', 'google']}},
  socialProviders: {
    ...(github && {github}),
    ...(google && {google}),
  },
  plugins: [apiKey({defaultPrefix: 'bb-', enableSessionForAPIKeys: true, requireName: true,
    rateLimit: {enabled: true, maxRequests: 250, timeWindow: 5 * 60 * 1000}, permissions: {defaultPermissions: () => ({})}}),
    ...(config.production ? [] : [openAPI()])],
  });
}

let auth: ReturnType<typeof createAuth> | undefined;
export const getAuth = () => (auth ??= createAuth());
