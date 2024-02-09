import 'dotenv/config';
import { getCurrentRuntimeEnvironment, isRunningInProduction } from './utils';
import { type CorsOptions } from 'cors';

/**
 * Represents the configuration options for the application.
 */
export type TConfig = {
  production: boolean;
  environment: 'production' | 'test' | 'development';
  /**
   * Define required environment variables to load from the `.env` file.
   */
  environmentVariables: string[];
  /**
   * The port to listen on.
   *
   * 8080 - Production
   *
   * 8070 - Test || Development
   *
   * any number when set by `proces.env.PORT`
   */
  port: 8080 | 8070 | number;
  cors: CorsOptions;
};

/**
 * The configuration object for the application.
 */
export const config: TConfig = {
  production: isRunningInProduction(),
  environment: getCurrentRuntimeEnvironment(),
  environmentVariables: [
    'ENV',
    // 'PORT',
  ],
  port:
    process.env.PORT != undefined
      ? Number(process.env.PORT)
      : isRunningInProduction()
      ? 8080
      : 8070,
  cors: {
    origin: isRunningInProduction() ? 'https://*budget-buddy.de' : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
};
