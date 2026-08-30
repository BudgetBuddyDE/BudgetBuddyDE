import {BackendConfig} from '@budgetbuddyde/core/config/BackendConfig';
import {getLogLevel} from '@budgetbuddyde/logger';
import {getCurrentRuntime, getPort} from '@budgetbuddyde/utils';
import 'dotenv/config';
import {name, version} from '../package.json';

export type Config = BackendConfig & {
  backendUrl: string;
  logLevel: string;
};

export const config: Config = Object.assign(
  new BackendConfig({
    service: name,
    version,
    port: getPort(3070),
    runtime: getCurrentRuntime(),
  }),
  {
    backendUrl: process.env.BUDGETBUDDY_BACKEND_URL || 'http://localhost:9000',
    logLevel: getLogLevel(process.env.LOG_LEVEL),
  },
);
