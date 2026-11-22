import {apiKey} from '@better-auth/api-key';
import * as authSchema from '@budgetbuddyde/db/auth';
import {preferences} from '@budgetbuddyde/db/backend';
import {betterAuth, type BetterAuthOptions} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {openAPI} from 'better-auth/plugins';
import {Resend} from 'resend';
import {config} from './config';
import {db} from './database';

const mail = new Resend(config.RESEND_API_KEY);
async function sendLink(to: string, subject: string, url: string) {
  const {error} = await mail.emails.send({
    from: config.production ? 'System <auth@mail.budget-buddy.de>' : 'Acme <onboarding@resend.dev>',
    to, subject, text: `${subject}: ${url}`,
  });
  if (error) console.error('Auth email delivery failed:', error.name);
}

// unstorage's normal getItem parses JSON; Better Auth needs the original string.
const secondaryStorage = {
  async get(key) {
    const value: unknown = await useStorage('auth').getItemRaw(key);
    if (value !== null && typeof value !== 'string') throw new Error('Invalid auth session storage value');
    return value;
  },
  set: (key, value, ttl) => useStorage('auth').setItemRaw(key, value, {ttl: ttl || 10}),
  delete: key => useStorage('auth').removeItem(key),
} satisfies NonNullable<BetterAuthOptions['secondaryStorage']>;

export const auth = betterAuth({
  appName: '@budgetbuddyde/backend', secret: config.AUTH_SECRET, baseURL: config.BASE_URL, basePath: '/api/auth',
  trustedOrigins: config.TRUSTED_ORIGINS,
  database: drizzleAdapter(db, {provider: 'pg', schema: authSchema}),
  secondaryStorage: config.AUTH_REDIS_URL ? secondaryStorage : undefined,
  databaseHooks: {user: {create: {async after(user) {
    try {
      await db.insert(preferences).values({ownerId: user.id, onboardingCompleted: false}).onConflictDoNothing({target: preferences.ownerId});
    } catch {
      console.error('Could not initialize preferences for newly registered user');
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
    disableSignUp: config.DISABLE_SIGNUP,
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
    ...(config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET && {github: {clientId: config.GITHUB_CLIENT_ID, clientSecret: config.GITHUB_CLIENT_SECRET}}),
    ...(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET && {google: {clientId: config.GOOGLE_CLIENT_ID, clientSecret: config.GOOGLE_CLIENT_SECRET}}),
  },
  plugins: [apiKey({defaultPrefix: 'bb-', enableSessionForAPIKeys: true, requireName: true,
    rateLimit: {enabled: true, maxRequests: 250, timeWindow: 5 * 60 * 1000}, permissions: {defaultPermissions: () => ({})}}),
    ...(config.production ? [] : [openAPI()])],
});
