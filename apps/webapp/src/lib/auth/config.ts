import {getOptionalEnvironmentValue, getRuntime, getTrustedOrigins} from '@budgetbuddyde/core/config/BackendConfig';
import {EnvironmentNotSetError} from '@budgetbuddyde/core/error/EnvironmentNotSetError';
import {getLogLevel, type LogThreshold} from '@budgetbuddyde/logger';

export type AuthRuntime = ReturnType<typeof getRuntime>;

export type AuthConfig = {
  runtime: AuthRuntime;
  baseUrl: string;
  service: string;
  secret: string;
  databaseUrl: string;
  resendApiKey: string;
  trustedOrigins: string[];
  disableSignUp: boolean;
  disableCsrfCheck: boolean;
  log: {
    level: LogThreshold;
  };
  socialProviders: {
    github: {
      clientId?: string;
      clientSecret?: string;
    };
    google: {
      clientId?: string;
      clientSecret?: string;
    };
  };
};

function getRequiredEnvironmentValue(environment: NodeJS.ProcessEnv, name: string): string {
  const value = getOptionalEnvironmentValue(environment, name);
  if (value === undefined) throw new EnvironmentNotSetError(name);
  return value;
}

/**
 * Builds the server-only Better Auth configuration from the process environment.
 * Values are read lazily so that `next build` does not require runtime secrets.
 */
export function getAuthConfig(environment: NodeJS.ProcessEnv = process.env): AuthConfig {
  const runtime = getRuntime(environment.NODE_ENV);
  const trustedOrigins = getTrustedOrigins(environment.TRUSTED_ORIGINS);

  if (runtime === 'production' && trustedOrigins.length === 0) {
    throw new EnvironmentNotSetError('TRUSTED_ORIGINS');
  }

  return {
    runtime,
    baseUrl: getOptionalEnvironmentValue(environment, 'BASE_URL') ?? 'http://localhost:3000',
    service: 'BudgetBuddyDE',
    secret: getRequiredEnvironmentValue(environment, 'AUTH_SECRET'),
    databaseUrl: getRequiredEnvironmentValue(environment, 'DATABASE_URL'),
    resendApiKey: getRequiredEnvironmentValue(environment, 'RESEND_API_KEY'),
    trustedOrigins: trustedOrigins.length > 0 ? trustedOrigins : ['http://localhost:3000'],
    disableSignUp: environment.DISABLE_SIGNUP === 'true',
    disableCsrfCheck: environment.DISABLE_CSRF_CHECK === 'true',
    log: {
      level: getLogLevel(environment.LOG_LEVEL),
    },
    socialProviders: {
      github: {
        clientId: getOptionalEnvironmentValue(environment, 'GITHUB_CLIENT_ID'),
        clientSecret: getOptionalEnvironmentValue(environment, 'GITHUB_CLIENT_SECRET'),
      },
      google: {
        clientId: getOptionalEnvironmentValue(environment, 'GOOGLE_CLIENT_ID'),
        clientSecret: getOptionalEnvironmentValue(environment, 'GOOGLE_CLIENT_SECRET'),
      },
    },
  };
}
