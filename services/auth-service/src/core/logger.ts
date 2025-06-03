import {createLogger} from '@budgetbuddyde/utils';

import {config} from '../config';

export const logger = createLogger({
  label: config.service,
  level: config.log.level,
  log: config.log.log,
});
