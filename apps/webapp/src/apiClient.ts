import {Api} from '@budgetbuddyde/api';
import {webappConfig} from './config';

export const apiClient = new Api(webappConfig.backendServiceHost, webappConfig.authServiceHost);
