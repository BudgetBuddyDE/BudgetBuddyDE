import type {CorsOptions} from 'cors';
import 'dotenv/config';

import {name, version} from '../package.json';
import {getPort} from './utils/getPort/getPort';
import {isProdEnv} from './utils/isProdEnv';

export type TConfig = {
  environment: 'production' | 'development';
  appName: typeof name;
  version: typeof version;
  port: number;
  cors: CorsOptions;
};

/**
 * Configuration object for this application.
 */
export const config: TConfig = {
  environment: isProdEnv() ? 'production' : 'development',
  appName: name,
  version: version,
  port: getPort(),

  cors: {
    origin: isProdEnv() ? [/\.budget-buddy\.de$/] : [/^(http|https):\/\/localhost(:\d+)?$/],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
    credentials: true,
  },
};
