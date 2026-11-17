import {z} from 'zod';

const optionalValue = z
  .string()
  .trim()
  .transform(value => (value === '' ? undefined : value))
  .optional();
const requiredValue = z.string().optional();

export const envSchema = z.strictObject({
  NODE_ENV: optionalValue,
  PORT: optionalValue,
  TIMEZONE: optionalValue,
  DATABASE_URL: requiredValue,
  AUTH_SECRET: requiredValue,
  RESEND_API_KEY: requiredValue,
  BASE_URL: optionalValue,
  TRUSTED_ORIGINS: optionalValue,
  DISABLE_CSRF_CHECK: optionalValue,
  DISABLE_SIGNUP: optionalValue,
  GITHUB_CLIENT_ID: optionalValue,
  GITHUB_CLIENT_SECRET: optionalValue,
  GOOGLE_CLIENT_ID: optionalValue,
  GOOGLE_CLIENT_SECRET: optionalValue,
  AUTH_REDIS_URL: optionalValue,
  AUTH_REDIS_DB: optionalValue,
  REDIS_URL: optionalValue,
  REDIS_DB: optionalValue,
  AWS_ENDPOINT_URL: optionalValue,
  AWS_S3_BUCKET_NAME: optionalValue,
  AWS_DEFAULT_REGION: optionalValue,
  AWS_ACCESS_KEY_ID: optionalValue,
  AWS_SECRET_ACCESS_KEY: optionalValue,
  LOG_LEVEL: optionalValue,
  TRUST_PROXY: optionalValue,
  OTEL_SERVICE_NAME: optionalValue,
  OTEL_EXPORTER_OTLP_ENDPOINT: optionalValue,
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: optionalValue,
  OTEL_EXPORTER_OTLP_PROTOCOL: optionalValue,
  OTEL_EXPORTER_OTLP_TRACES_PROTOCOL: optionalValue,
  OTEL_TRACES_EXPORTER: optionalValue,
});

export type EnvironmentInput = z.input<typeof envSchema>;

export type BackendEnvironment = z.infer<typeof envSchema>;

export type ValidatedBackendEnvironment = BackendEnvironment & {
  BASE_URL: string;
  DATABASE_URL: string;
  AUTH_SECRET: string;
  RESEND_API_KEY: string;
};

export function parseEnvironment(environment: EnvironmentInput): BackendEnvironment {
  const knownValues = Object.fromEntries(
    Object.keys(envSchema.shape).map(name => [name, environment[name as keyof EnvironmentInput]]),
  );
  const result = envSchema.safeParse(knownValues);
  if (!result.success) {
    const variables = Array.from(
      new Set(result.error.issues.map(issue => String(issue.path[0] ?? 'unknown environment variable'))),
    );
    throw new Error(`Invalid environment variables: ${variables.join(', ')}.`);
  }
  return result.data;
}
