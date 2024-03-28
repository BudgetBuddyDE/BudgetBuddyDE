import 'dotenv/config';
import {type CorsOptions} from 'cors';
import {getCurrentRuntimeEnvironment, isRunningInProduction} from './utils';

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
   * 7080 - Production
   *
   * 7070 - Test || Development
   *
   * any number when set by `proces.env.PORT`
   */
  port: 7080 | 7070 | number;
  cors: CorsOptions;
  stocks: {
    /**
     * The interval (in minutes) in which the stock prices are fetched from the API.
     */
    fetchInterval: number;
  };
  log: {
    default: string;
    test: string;
  };
  enableBackgroundJobs: boolean;
};

/**
 * The configuration object for the application.
 */
export const config: TConfig = {
  production: isRunningInProduction(),
  environment: getCurrentRuntimeEnvironment(),
  environmentVariables: [
    'ENV',
    'BACKEND_HOST',
    'DATABASE_URL',
    'STOCK_API_URL',
    // 'PORT',
  ],
  port: process.env.PORT != undefined ? Number(process.env.PORT) : isRunningInProduction() ? 7080 : 7070,
  stocks: {
    fetchInterval: 1,
  },
  cors: {
    origin: isRunningInProduction() ? [/\.budget-buddy\.de$/] : [/\.localhost\$/],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
  log: {
    default: 'info',
    test: 'error',
  },
  enableBackgroundJobs: process.env.ENABLE_BACKGROUND_JOBS ? process.env.ENABLE_BACKGROUND_JOBS === 'true' : false,
};
