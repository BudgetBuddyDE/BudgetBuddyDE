import {createLogger} from '@budgetbuddyde/utils/lib/logger';

import {AppConfig} from './app.config';

export const logger = createLogger({label: AppConfig.appName, level: AppConfig.logLevel});
