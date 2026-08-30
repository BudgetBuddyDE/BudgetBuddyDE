import {Api} from '@budgetbuddyde/api';

export const apiClient = new Api(
  process.env.NEXT_PUBLIC_BACKEND_SERVICE_HOST || 'http://localhost:9000',
  process.env.NEXT_PUBLIC_AUTH_SERVICE_HOST || 'http://localhost:8080',
);
