import {apiKeyClient} from '@better-auth/api-key/client';
import {createAuthClient} from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_SERVICE_HOST || 'http://localhost:8080',
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [apiKeyClient()],
});
