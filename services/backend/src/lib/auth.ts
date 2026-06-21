import {createAuthClient} from 'better-auth/client';
import {apiKeyClient} from "@better-auth/api-key/client"

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.AUTH_SERVICE_HOST || 'http://localhost:8080',
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [apiKeyClient()],
});
