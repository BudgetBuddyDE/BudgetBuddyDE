import {Api} from '@budgetbuddyde/api';
import {config} from '../config';

/**
 * Returns a RequestInit config that authenticates requests to the backend via API key.
 */
export function getApiRequestConfig(): RequestInit {
  return {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': config.backendApiKey,
    },
  };
}

/**
 * Singleton API client pointed at the configured backend.
 */
export const api = new Api(config.backendUrl);
