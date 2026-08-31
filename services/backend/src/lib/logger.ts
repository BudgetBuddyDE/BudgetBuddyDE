import {createLogger, type Logger} from '@budgetbuddyde/logger';
import {createConsoleSink, formatConsoleEvent} from '@budgetbuddyde/logger/console';
import {config} from '../config';

export const logger: Logger = createLogger({
  sinks: [createConsoleSink({formatter: formatConsoleEvent})],
  context: {
    service: config.service,
    version: config.version,
    runtime: config.runtime,
  },
  threshold: config.log.level,
});
