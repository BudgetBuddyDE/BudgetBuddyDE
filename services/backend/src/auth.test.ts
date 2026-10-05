import {beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  options: undefined as any,
  config: {
    runtime: 'development',
    service: 'backend',
    log: {level: 'info'},
    auth: {
      secret: 'test-secret',
      baseUrl: 'http://localhost:9000',
      trustedOrigins: ['http://localhost:3000'],
      disableCsrfCheck: false,
      disableSignUp: false,
      redis: {url: undefined as string | undefined},
      socialProviders: {
        github: {clientId: 'github-id', clientSecret: 'github-secret'},
        google: {clientId: undefined, clientSecret: undefined},
      },
    },
  },
  logger: {debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn()},
  mail: {
    sendVerificationEmail: vi.fn(),
    sendChangeEmailRequest: vi.fn(),
    sendPasswordReset: vi.fn(),
    sendAccountDeletionVerification: vi.fn(),
  },
  redis: {set: vi.fn(), get: vi.fn(), del: vi.fn()},
  apiKey: vi.fn(),
  openAPI: vi.fn(),
}));
vi.mock('./config', () => ({config: mocks.config}));
vi.mock('./db', () => ({db: {}}));
vi.mock('./db/redis', () => ({getAuthRedisClient: () => mocks.redis}));
vi.mock('./lib/logger', () => ({logger: {child: () => mocks.logger}}));
vi.mock('./lib/resend', () => ({resendManager: mocks.mail}));
vi.mock('better-auth', () => ({
  betterAuth: (options: any) => {
    mocks.options = options;
    return {api: {}};
  },
}));
vi.mock('better-auth/adapters/drizzle', () => ({drizzleAdapter: vi.fn(() => 'adapter')}));
vi.mock('@better-auth/api-key', () => ({apiKey: mocks.apiKey}));
vi.mock('better-auth/plugins', () => ({openAPI: mocks.openAPI}));

async function loadAuth() {
  vi.resetModules();
  return import('./auth');
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.config.runtime = 'development';
  mocks.config.auth.redis.url = undefined;
  Object.values(mocks.mail).forEach(fn => fn.mockResolvedValue([{id: 'mail-id'}, null]));
  mocks.redis.set.mockResolvedValue('OK');
  mocks.redis.del.mockResolvedValue(1);
  mocks.apiKey.mockReturnValue({id: 'api-key'});
  mocks.openAPI.mockReturnValue({id: 'open-api'});
});

describe('integrated Better Auth', () => {
  it('preserves security and independently limits API keys', async () => {
    await loadAuth();
    expect(mocks.options).toMatchObject({
      baseURL: 'http://localhost:9000',
      basePath: '/api/auth',
      secret: 'test-secret',
      trustedOrigins: ['http://localhost:3000'],
      database: 'adapter',
      advanced: {
        disableCSRFCheck: false,
        cookiePrefix: 'budget-buddy',
        defaultCookieAttributes: {sameSite: 'none', secure: true},
      },
      emailAndPassword: {enabled: true, autoSignIn: true, revokeSessionsOnPasswordReset: true},
      user: {changeEmail: {updateEmailWithoutVerification: false}},
      account: {accountLinking: {allowUnlinkingAll: false, allowDifferentEmails: false}},
    });
    expect(mocks.options.secondaryStorage).toBeUndefined();
    expect(mocks.apiKey).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPrefix: 'bb-',
        enableSessionForAPIKeys: true,
        requireName: true,
        rateLimit: {enabled: true, maxRequests: 250, timeWindow: 300000},
      }),
    );
    expect(mocks.apiKey.mock.calls[0]![0].permissions.defaultPermissions()).toEqual({});
    expect(mocks.options.socialProviders.github.enabled).toBe(true);
    expect(mocks.options.socialProviders.google.enabled).toBe(false);
    expect(mocks.openAPI).toHaveBeenCalledOnce();
  });

  it('uses production cookies and omits development OpenAPI', async () => {
    mocks.config.runtime = 'production';
    await loadAuth();
    expect(mocks.options.advanced).toMatchObject({
      useSecureCookies: true,
      crossSubDomainCookies: {domain: '.budget-buddy.de'},
    });
    expect(mocks.openAPI).not.toHaveBeenCalled();
    expect(mocks.options.plugins).toHaveLength(1);
  });

  it('awaits optional secondary storage writes and propagates failures', async () => {
    mocks.config.auth.redis.url = 'redis://localhost:6379';
    await loadAuth();
    await mocks.options.secondaryStorage.set('session', 'value', 60);
    expect(mocks.redis.set).toHaveBeenCalledWith('session', 'value', 'EX', 60);
    await mocks.options.secondaryStorage.set('fallback', 'value', undefined);
    expect(mocks.redis.set).toHaveBeenLastCalledWith('fallback', 'value', 'EX', 10);
    mocks.redis.get.mockResolvedValue('value');
    expect(await mocks.options.secondaryStorage.get('session')).toBe('value');
    await mocks.options.secondaryStorage.delete('session');
    expect(mocks.redis.del).toHaveBeenCalledWith('session');
    mocks.redis.set.mockRejectedValue(new Error('Redis unavailable'));
    await expect(mocks.options.secondaryStorage.set('session', 'value', 60)).rejects.toThrow('Redis unavailable');
  });

  it.each([
    ['reset', 'sendPasswordReset', ['old@example.com', 'Ada', 'https://app/link']],
    ['change', 'sendChangeEmailRequest', ['old@example.com', 'new@example.com', 'https://app/link']],
    ['delete', 'sendAccountDeletionVerification', ['old@example.com', 'https://app/link']],
    ['verify', 'sendVerificationEmail', ['old@example.com', 'https://app/link']],
  ] as const)('invokes %s mail hook and handles delivery errors', async (kind, method, expected) => {
    await loadAuth();
    const callbacks = {
      reset: mocks.options.emailAndPassword.sendResetPassword,
      change: mocks.options.user.changeEmail.sendChangeEmailConfirmation,
      delete: mocks.options.user.deleteUser.sendDeleteAccountVerification,
      verify: mocks.options.emailVerification.sendVerificationEmail,
    };
    const data = {
      user: {id: 'user-1', email: 'old@example.com', name: 'Ada'},
      url: 'https://app/link',
      newEmail: 'new@example.com',
    };
    await callbacks[kind](data);
    expect(mocks.mail[method]).toHaveBeenCalledWith(...expected);
    expect(mocks.logger.info).toHaveBeenCalledWith(expect.stringContaining('sent to'), 'mail-id', 'old@example.com');
    mocks.mail[method].mockResolvedValue([null, new Error('mail unavailable')]);
    await expect(callbacks[kind](data)).resolves.toBeUndefined();
    expect(mocks.logger.error).toHaveBeenCalledWith(expect.any(String), 'old@example.com', expect.any(Error));
  });

  it('logs deletion, verification outcomes and Better Auth messages', async () => {
    await loadAuth();
    await mocks.options.user.deleteUser.afterDelete({email: 'ada@example.com'});
    await mocks.options.emailVerification.afterEmailVerification({email: 'ada@example.com', emailVerified: true});
    await mocks.options.emailVerification.afterEmailVerification({email: 'ada@example.com', emailVerified: false});
    for (const level of ['debug', 'warn', 'error', 'info', 'other'])
      mocks.options.logger.log(level, 'message', {context: true});
    for (const level of ['debug', 'warn', 'error', 'info'] as const)
      expect(mocks.logger[level]).toHaveBeenCalledWith('message', {context: true});
    expect(mocks.logger.error).toHaveBeenCalledWith('Email verification failed for user: ada@example.com');
  });

  it('maps supported log thresholds', async () => {
    const {mapLogLevelForBetterAuth} = await loadAuth();
    for (const [input, output] of [
      ['trace', 'debug'],
      ['debug', 'debug'],
      ['info', 'info'],
      ['warn', 'warn'],
      ['error', 'error'],
      ['silent', 'error'],
      ['unknown', undefined],
    ])
      expect(mapLogLevelForBetterAuth(input as never)).toBe(output);
  });
});
