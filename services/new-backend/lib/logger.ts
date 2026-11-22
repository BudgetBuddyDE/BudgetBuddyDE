import {createLogger, getLogLevel} from '@budgetbuddyde/logger';

// Read runtime environment values rather than Nitro's build-time NODE_ENV constant.
const {NODE_ENV, LOG_LEVEL} = process.env;
export const logLevel = getLogLevel(LOG_LEVEL);

export const logger = createLogger({
  context: {service: '@budgetbuddyde/new-backend', runtime: NODE_ENV || 'development'},
  threshold: logLevel,
});
