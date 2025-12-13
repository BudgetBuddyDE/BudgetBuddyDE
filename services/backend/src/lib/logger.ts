import {ConsoleTransport, createLogger} from '@budgetbuddyde/logger';

import {config} from '../config';

export const logger = createLogger({
  label: config.service,
  level: config.log.level,
  defaultMeta: {
    service: config.service,
    version: config.version,
    runtime: config.runtime,
  },
  transports: [new ConsoleTransport({batchSize: 1, debounceMs: 0})],
  hideMeta: true,
});
