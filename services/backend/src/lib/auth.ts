import {createAuthClient} from 'better-auth/client';
import {apiKeyClient} from '@better-auth/api-key/client';
import {config} from '../config';

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: config.auth.baseUrl,
  fetchOptions: {
    credentials: config.auth.credentials,
  },
  plugins: [apiKeyClient()],
});
