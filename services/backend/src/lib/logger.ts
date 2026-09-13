import {createServiceLogger} from '@budgetbuddyde/logger/console';
import {config} from '../config';

export const logger = createServiceLogger(
  {
    service: config.service,
    version: config.version,
    runtime: config.runtime,
  },
  config.log?.level ?? 'info',
);
