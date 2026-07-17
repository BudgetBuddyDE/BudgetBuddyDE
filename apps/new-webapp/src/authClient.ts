import {apiKeyClient} from '@better-auth/api-key/client';
import {createAuthClient} from 'better-auth/react';
import {appConfig} from './appConfig';

export const authClient = createAuthClient({
  baseURL: appConfig.authUrl,
  plugins: [apiKeyClient()],
});
