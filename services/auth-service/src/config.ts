import {type Runtime, getCurrentRuntime, getPort, isRunningInProd} from '@budgetbuddyde/utils';
import type {CorsOptions} from 'cors';
import 'dotenv/config';

import {name, version} from '../package.json';

export type TConfig = {
  environment: Runtime;
  appName: typeof name;
  version: typeof version;
  port: number;
  cors: CorsOptions;
};

/**
 * Configuration object for this application.
 */
export const config: TConfig = {
  environment: getCurrentRuntime(),
  appName: name,
  version: version,
  port: getPort(),
  cors: {
    origin: isRunningInProd() ? [/\.budget-buddy\.de$/] : [/^(http|https):\/\/localhost(:\d+)?$/],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
    credentials: true,
  },
};
