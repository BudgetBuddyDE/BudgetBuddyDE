import {createLogger} from '@budgetbuddyde/logger';
import {createConsoleLogEventWriter} from '@budgetbuddyde/logger/console';
import {webappConfig} from './config';

export const logger = createLogger(createConsoleLogEventWriter(), {
  context: {
    service: webappConfig.service,
    version: webappConfig.version,
    runtime: webappConfig.runtime,
  },
  threshold: webappConfig.log.level,
});
