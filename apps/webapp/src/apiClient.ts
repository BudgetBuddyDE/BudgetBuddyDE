import {Api} from '@budgetbuddyde/api';
import {webappConfig} from './config';
import {logger} from './logger';

// The auth data-export endpoint is served by this app, so the auth host is same-origin.
export const apiClient = new Api(webappConfig.backendServiceHost, '', logger.child({module: 'apiClient'}));
