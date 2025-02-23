import {createLogger, getLogLevel} from '@budgetbuddyde/utils';

import {config} from '../config';

export const logger = createLogger({
  label: config.appName,
  level: getLogLevel(),
});
