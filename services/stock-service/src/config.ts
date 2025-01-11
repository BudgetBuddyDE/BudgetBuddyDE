import {getCurrentRuntime, getPort, isRunningInProd} from '@budgetbuddyde/utils';
import {type CorsOptions} from 'cors';
import 'dotenv/config';

import {name, version} from '../package.json';

/**
 * Represents the configuration options for the application.
 */
export type TConfig = {
  production: boolean;
  environment: 'production' | 'test' | 'development';
  appName: typeof name;
  version: typeof version;
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
  port: number;
  cors: CorsOptions;
  stocks: {
    /**
     * The interval (in minutes) in which the stock prices are fetched from the API.
     */
    fetchInterval: number;
  };
  enableBackgroundJobs: boolean;
};

const isProdRuntime = isRunningInProd();

/**
 * The configuration object for the application.
 */
export const config: TConfig = {
  production: isProdRuntime,
  environment: getCurrentRuntime(),
  appName: name,
  version: version,
  environmentVariables: [
    'NODE_ENV',
    'BEARER_TOKEN_SECRET',
    'STOCK_API_URL',
    'POCKETBASE_URL',
    'SERVICE_ACCOUNT_EMAIL',
    'SERVICE_ACCOUNT_PASSWORD',
    'METAL_API_KEY',
    // 'PORT',
  ],
  port: getPort(),
  stocks: {
    fetchInterval: 1,
  },
  cors: {
    origin: isRunningInProd() ? [/\.budget-buddy\.de$/] : [/\.localhost\$/],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
    credentials: true,
  },
  enableBackgroundJobs: process.env.ENABLE_BACKGROUND_JOBS ? process.env.ENABLE_BACKGROUND_JOBS === 'true' : false,
};
