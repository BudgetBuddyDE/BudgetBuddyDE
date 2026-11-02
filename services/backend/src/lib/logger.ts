import {createLogger} from '@budgetbuddyde/logger';
import {config} from '../config';

export const logger = createLogger({
  context: {
    service: config.service,
    version: config.version,
    runtime: config.runtime,
  },
  threshold: config.log?.level ?? 'info',
});
