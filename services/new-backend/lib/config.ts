import {getLogLevel} from '@budgetbuddyde/logger';
import {z} from 'zod';

const origin = z
  .url({protocol: /^https?$/})
  .refine(value => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return url.pathname === '/' && !url.username && !url.password && !url.search && !url.hash;
  })
  .transform(value => new URL(value).origin);
const redisUrl = z.url({protocol: /^rediss?$/}).optional();
const dbIndex = z.coerce.number().int().nonnegative();
const secret = z.string().min(1);

const databaseSchema = z.object({DATABASE_URL: z.url({protocol: /^postgres(ql)?$/})});
const kvRedisSchema = z.object({REDIS_URL: redisUrl, REDIS_DB: dbIndex.default(1)});
const authRedisSchema = z.object({AUTH_REDIS_URL: redisUrl, AUTH_REDIS_DB: dbIndex.default(0)});
const emailSchema = z.object({RESEND_API_KEY: secret});
const authSchema = z.object({
  AUTH_SECRET: secret,
  BASE_URL: origin,
  TRUSTED_ORIGINS: z.array(origin).min(1).readonly(),
  DISABLE_SIGNUP: z.stringbool().default(false),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

function requireValid<T>(result: z.ZodSafeParseResult<T>): T {
  if (!result.success) throw result.error;
  return result.data;
}

function oauthCredentials(clientId: string | undefined, clientSecret: string | undefined) {
  return clientId && clientSecret ? Object.freeze({clientId, clientSecret}) : undefined;
}

/** Validates each configuration area independently so unrelated errors do not block reads. */
export function parseBackendEnvironment(env: NodeJS.ProcessEnv) {
  const production = env.NODE_ENV === 'production';
  const database = databaseSchema.safeParse(env);
  const kvRedis = kvRedisSchema.safeParse({...env, REDIS_URL: env.REDIS_URL || undefined});
  const authRedis = authRedisSchema.safeParse({...env, AUTH_REDIS_URL: env.AUTH_REDIS_URL || undefined});
  const email = emailSchema.safeParse(env);
  const auth = authSchema.safeParse({
    ...env,
    BASE_URL: env.BASE_URL || (production ? undefined : 'http://localhost:9100'),
    TRUSTED_ORIGINS: (env.TRUSTED_ORIGINS || (production ? '' : 'http://localhost:3000'))
      .split(',')
      .map(value => value.trim())
      .filter(Boolean),
  });

  return Object.freeze({
    production,
    logging: Object.freeze({runtime: env.NODE_ENV || 'development', level: getLogLevel(env.LOG_LEVEL)}),
    get database() {
      return Object.freeze({connectionString: requireValid(database).DATABASE_URL, connectionTimeoutMillis: 5000, max: 20});
    },
    redis: Object.freeze({
      authConfigured: Boolean(env.AUTH_REDIS_URL),
      options: Object.freeze({connectTimeout: 5000, commandTimeout: 5000, maxRetriesPerRequest: 1}),
      get kv() {
        const {REDIS_URL: url, REDIS_DB: db} = requireValid(kvRedis);
        return url ? Object.freeze({url, db}) : undefined;
      },
      get auth() {
        const {AUTH_REDIS_URL: url, AUTH_REDIS_DB: db} = requireValid(authRedis);
        return url ? Object.freeze({url, db}) : undefined;
      },
    }),
    get auth() {
      const env = requireValid(auth);
      return Object.freeze({
        secret: env.AUTH_SECRET,
        baseUrl: env.BASE_URL,
        trustedOrigins: env.TRUSTED_ORIGINS,
        disableSignUp: env.DISABLE_SIGNUP,
        github: oauthCredentials(env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET),
        google: oauthCredentials(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET),
      });
    },
    get email() {
      return Object.freeze({
        resendApiKey: requireValid(email).RESEND_API_KEY,
        from: production ? 'System <auth@mail.budget-buddy.de>' : 'Acme <onboarding@resend.dev>',
      });
    },
    health: Object.freeze({queryTimeoutMs: 1500, responseTimeoutMs: 2000}),
  });
}

/** The server's runtime configuration snapshot, shared by all consumers in this process. */
export class BackendConfig {
  static #instance: BackendConfig | undefined;
  readonly #sections: ReturnType<typeof parseBackendEnvironment>;

  private constructor(sections: ReturnType<typeof parseBackendEnvironment>) {
    this.#sections = sections;
  }

  static getInstance(): BackendConfig {
    return (this.#instance ??= new BackendConfig(parseBackendEnvironment({...process.env})));
  }

  get production() {
    return this.#sections.production;
  }

  get logging() {
    return this.#sections.logging;
  }

  get database() {
    return this.#sections.database;
  }

  get redis() {
    return this.#sections.redis;
  }

  get auth() {
    return this.#sections.auth;
  }

  get email() {
    return this.#sections.email;
  }

  get health() {
    return this.#sections.health;
  }
}

export function invalidConfigFields(error: z.ZodError): string[] {
  return [...new Set(error.issues.map(issue => String(issue.path[0])))];
}
