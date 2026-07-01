import {Api} from '@budgetbuddyde/api';
import {config} from '../config';
import {getRequestAuthContext} from './requestAuth';

/**
 * Returns a RequestInit config that authenticates requests to the backend with request credentials.
 */
export function getApiRequestConfig(): RequestInit {
  const requestAuth = getRequestAuthContext();
  if (!requestAuth) {
    throw new Error('Missing request authentication context');
  }

  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-API-KEY': requestAuth.token,
  });

  return {
    headers,
  };
}

/**
 * Singleton API client pointed at the configured backend.
 */
export const api = new Api(config.backendUrl);
