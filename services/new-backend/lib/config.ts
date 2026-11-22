import {z} from 'zod';

const origin = z.url({protocol: /^https?$/}).refine(value => {
  const url = new URL(value);
  return url.pathname === '/' && !url.username && !url.password && !url.search && !url.hash;
}).transform(value => new URL(value).origin);
const redisUrl = z.url({protocol: /^rediss?$/}).optional();
const dbIndex = z.coerce.number().int().nonnegative();

export function readConfig(env: NodeJS.ProcessEnv) {
  const production = env.NODE_ENV === 'production';
  return z.object({
    DATABASE_URL: z.url({protocol: /^postgres(ql)?$/}),
    AUTH_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    BASE_URL: origin,
    TRUSTED_ORIGINS: z.array(origin).min(1),
    AUTH_REDIS_URL: redisUrl,
    REDIS_URL: redisUrl,
    AUTH_REDIS_DB: dbIndex.default(0),
    REDIS_DB: dbIndex.default(1),
    GITHUB_CLIENT_ID: z.string().optional(), GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(), GOOGLE_CLIENT_SECRET: z.string().optional(),
    DISABLE_SIGNUP: z.stringbool().default(false),
    production: z.boolean(),
  }).parse({
    ...env, production,
    BASE_URL: env.BASE_URL || (production ? undefined : 'http://localhost:9100'),
    TRUSTED_ORIGINS: (env.TRUSTED_ORIGINS || (production ? '' : 'http://localhost:3000')).split(',').map(s => s.trim()).filter(Boolean),
    AUTH_REDIS_URL: env.AUTH_REDIS_URL || undefined, REDIS_URL: env.REDIS_URL || undefined,
  });
}

export const config = readConfig(process.env);
