import {type CorsOptions} from 'cors';
import 'dotenv/config';

import {getCurrentRuntimeEnvironment, getPort, isRunningInProduction} from './utils';

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
  port: number;
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
  sender: string;
  host: string;
  company: string;
};

/**
 * The configuration object for the application.
 */
export const config: TConfig = {
  production: isRunningInProduction(),
  environment: getCurrentRuntimeEnvironment(),
  environmentVariables: [
    'ENV',
    'POCKETBASE_URL',
    'SERVICE_ACCOUNT_EMAIL',
    'SERVICE_ACCOUNT_PASSWORD',
    'HOST',
    'MAIL_SENDER',
    'RESEND_API_KEY',
    'STOCK_SERVICE_HOST',
    'STOCK_SERVICE_BEARER_TOKEN',
    // 'PORT',
  ],
  port: getPort(),
  stocks: {
    fetchInterval: 1,
  },
  cors: {
    origin: isRunningInProduction() ? [/\.budget-buddy\.de$/] : [/\.localhost\$/],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
    credentials: true,
  },
  log: {
    default: 'info',
    test: 'error',
  },
  sender: process.env.MAIL_SENDER || 'delivered@resend.dev',
  host: isRunningInProduction() ? (process.env.HOST as string) : `http://localhost:${getPort()}`,
  company: 'Budget-Buddy',
};
