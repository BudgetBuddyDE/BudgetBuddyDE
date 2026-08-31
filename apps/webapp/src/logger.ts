import {createLogger} from '@budgetbuddyde/logger';
import {createConsoleSink, formatConsoleEvent} from '@budgetbuddyde/logger/console';
import {webappConfig} from './config';

export const logger = createLogger({
  sinks: [createConsoleSink({formatter: formatConsoleEvent})],
  context: {
    service: webappConfig.service,
    version: webappConfig.version,
    runtime: webappConfig.runtime,
  },
  threshold: webappConfig.log.level,
});
