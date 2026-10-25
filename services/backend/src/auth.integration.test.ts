import type {apiKey} from '@better-auth/api-key';
import type {betterAuth} from 'better-auth';
import {beforeEach, describe, expect, it, vi} from 'vite-plus/test';
import type {auth as BackendAuth} from './auth';

type AuthWithApiKeys = typeof BackendAuth & ReturnType<typeof betterAuth<{plugins: [ReturnType<typeof apiKey>]}>>;

const state = vi.hoisted(() => ({
  database: {user: [], session: [], account: [], verification: [], apikey: []} as Record<
    string,
    Record<string, unknown>[]
  >,
  secondary: new Map<string, string>(),
  initializePreferences: vi.fn(),
}));

// Keep the migrated Better Auth options and plugins, replacing only infrastructure boundaries.
vi.mock('better-auth', async importOriginal => {
  const original = await importOriginal<typeof import('better-auth')>();
  const {memoryAdapter} = await import('better-auth/adapters/memory');
  return {
    ...original,
    betterAuth: (options: Parameters<typeof original.betterAuth>[0]) =>
      original.betterAuth({...options, database: memoryAdapter(state.database)}),
  };
});
vi.mock('./config', async importOriginal => {
  const original = await importOriginal<typeof import('./config')>();
  return {
    ...original,
    config: {
      ...original.config,
      auth: {...original.config.auth, redis: {url: 'redis://unit-test-memory', database: 0}},
    },
  };
});
vi.mock('./db', () => ({db: {}}));
vi.mock('./lib/preferences', () => ({initializePreferences: state.initializePreferences}));
vi.mock('./db/redis', () => ({
  getAuthRedisClient: () => ({
    set: async (key: string, value: string) => {
      state.secondary.set(key, value);
      return 'OK';
    },
    get: async (key: string) => state.secondary.get(key) ?? null,
    del: async (key: string) => Number(state.secondary.delete(key)),
  }),
}));
vi.mock('./lib/resend', () => ({
  resendManager: {
    sendVerificationEmail: vi.fn(async () => [{id: 'test-mail'}, null]),
    sendChangeEmailRequest: vi.fn(async () => [{id: 'test-mail'}, null]),
    sendPasswordReset: vi.fn(async () => [{id: 'test-mail'}, null]),
    sendAccountDeletionVerification: vi.fn(async () => [{id: 'test-mail'}, null]),
  },
}));

let auth: AuthWithApiKeys;
let userId: string;
let cookie: string;

// Allow cold module loading under CI contention without relaxing registration or test timeouts.
beforeEach(async function initializeAuth() {
  vi.resetModules();
  auth = (await import('./auth')).auth as AuthWithApiKeys;
}, 30_000);

beforeEach(async function registerTestUser() {
  state.secondary.clear();
  state.initializePreferences.mockReset();
  for (const table of Object.keys(state.database)) state.database[table] = [];
  const signup = await auth.api.signUpEmail({
    body: {email: 'auth-unit@example.invalid', name: 'Unit User', password: 'unit-password-long-enough'},
    returnHeaders: true,
  });
  userId = signup.response.user.id;
  // Send only the signed token, so these tests exercise the session store rather than cookie caching.
  cookie = signup.headers
    .getSetCookie()
    .map(value => value.split(';')[0]!)
    .find(value => value.includes('.session_token='))!;
  expect(cookie).toBeDefined();
});

describe('migrated authentication with real Better Auth', () => {
  it('initializes preferences on registration but not on subsequent sign-in', async () => {
    expect(state.initializePreferences).toHaveBeenCalledExactlyOnceWith(userId);
    await auth.api.signInEmail({body: {email: 'auth-unit@example.invalid', password: 'unit-password-long-enough'}});
    expect(state.initializePreferences).toHaveBeenCalledTimes(1);
  });

  it('allows registration and sign-in when preferences initialization fails', async () => {
    state.initializePreferences.mockRejectedValueOnce(new Error('Preferences database unavailable'));
    const body = {
      email: 'preferences-failure@example.invalid',
      name: 'Preferences Failure',
      password: 'unit-password-long-enough',
    };

    const signup = await auth.api.signUpEmail({body});
    expect(signup.user.id).toBeDefined();
    expect(state.initializePreferences).toHaveBeenLastCalledWith(signup.user.id);

    const signin = await auth.api.signInEmail({body: {email: body.email, password: body.password}});
    expect(signin.user.id).toBe(signup.user.id);
    expect(state.initializePreferences).toHaveBeenCalledTimes(2);
  }, 15_000);
  it('looks up signed cookie sessions from the existing secondary-storage format', async () => {
    const session = await auth.api.getSession({headers: new Headers({cookie})});
    expect(session?.user.id).toBe(userId);
    expect(session?.session.userId).toBe(userId);
    expect(state.database.session).toEqual([]);
    const stored = [...state.secondary.values()].map(value => JSON.parse(value) as Record<string, unknown>);
    expect(stored).toContainEqual(
      expect.objectContaining({
        session: expect.objectContaining({userId}),
        user: expect.objectContaining({id: userId}),
      }),
    );
    expect(state.secondary.has(`active-sessions-${userId}`)).toBe(true);
  });

  it('continues a signed session after reconstructing the backend with the same store and secret', async () => {
    vi.resetModules();
    const restarted = (await import('./auth')).auth;
    const session = await restarted.api.getSession({headers: new Headers({cookie})});
    expect(session?.user.id).toBe(userId);
  });

  it('uses the API-key plugin to authenticate local session lookups', async () => {
    const key = await auth.api.createApiKey({body: {userId, name: 'Unit integration key'}});
    const session = await auth.api.getSession({headers: new Headers({'x-api-key': key.key})});
    expect(key.key).toMatch(/^bb-/);
    expect(session?.user.id).toBe(userId);
    expect(session?.session.id).toBe(key.id);
    expect(state.database.apikey).toHaveLength(1);
    expect(state.database.apikey![0]!.key).not.toBe(key.key);
    expect(state.database.apikey![0]).toMatchObject({rateLimitMax: 250, rateLimitTimeWindow: 300000});
  });

  it('rejects invalid and revoked API keys without authenticating the owner', async () => {
    await expect(
      auth.api.getSession({headers: new Headers({'x-api-key': `bb-${'invalid'.repeat(12)}`})}),
    ).rejects.toMatchObject({status: 'UNAUTHORIZED'});
    const key = await auth.api.createApiKey({body: {userId, name: 'Revoked integration key'}});
    await auth.api.deleteApiKey({headers: new Headers({cookie}), body: {keyId: key.id}});
    await expect(auth.api.getSession({headers: new Headers({'x-api-key': key.key})})).rejects.toMatchObject({
      status: 'UNAUTHORIZED',
    });
  });

  it('rejects disabled keys and keys whose owner no longer exists', async () => {
    const disabled = await auth.api.createApiKey({body: {userId, name: 'Disabled integration key'}});
    state.database.apikey!.find(record => record.id === disabled.id)!.enabled = false;
    await expect(auth.api.getSession({headers: new Headers({'x-api-key': disabled.key})})).rejects.toMatchObject({
      status: 'UNAUTHORIZED',
    });
    const orphaned = await auth.api.createApiKey({body: {userId, name: 'Orphaned integration key'}});
    state.database.user = [];
    await expect(auth.api.getSession({headers: new Headers({'x-api-key': orphaned.key})})).rejects.toMatchObject({
      status: 'UNAUTHORIZED',
    });
  });

  it('returns no session for anonymous and expired cookie requests', async () => {
    await expect(auth.api.getSession({headers: new Headers()})).resolves.toBeNull();
    for (const [key, value] of state.secondary) {
      const record = JSON.parse(value) as {session?: {expiresAt: string}};
      if (record.session) {
        record.session.expiresAt = new Date(0).toISOString();
        state.secondary.set(key, JSON.stringify(record));
      }
    }
    await expect(auth.api.getSession({headers: new Headers({cookie})})).resolves.toBeNull();
  });
});
