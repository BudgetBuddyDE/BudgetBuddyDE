import {Api} from '@budgetbuddyde/api';
import {webappConfig} from './config';
import {logger} from './logger';

export const apiClient = new Api(
  webappConfig.backendServiceHost,
  webappConfig.authServiceHost,
  logger.child({module: 'apiClient'}),
);
