import {openAPI} from 'better-auth/plugins';
import {createAuthClient} from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_SERVICE_HOST,
  plugins: [openAPI()],
});
