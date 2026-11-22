import {createLogger} from '@budgetbuddyde/logger';
import {BackendConfig} from './config';

const {runtime, level} = BackendConfig.getInstance().logging;

export const logger = createLogger({
  context: {service: '@budgetbuddyde/new-backend', runtime},
  threshold: level,
});
