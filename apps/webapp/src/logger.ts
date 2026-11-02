import {createLogger} from '@budgetbuddyde/logger';
import {webappConfig} from './config';

export const logger = createLogger({
  context: {
    service: webappConfig.service,
    version: webappConfig.version,
    runtime: webappConfig.runtime,
  },
  threshold: webappConfig.log.level,
});
