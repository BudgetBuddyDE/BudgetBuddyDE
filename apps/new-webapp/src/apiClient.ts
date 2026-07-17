import {Api} from '@budgetbuddyde/api';
import {appConfig} from './appConfig';

export const apiClient = new Api(appConfig.backendUrl);
