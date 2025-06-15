import {admin, bearer, multiSession, openAPI} from 'better-auth/plugins';
import {createAuthClient} from 'better-auth/react';

const {AUTH_SERVICE_HOST} = process.env;

export const authClient = createAuthClient({
  baseURL: AUTH_SERVICE_HOST,
  plugins: [bearer(), admin(), openAPI(), multiSession()],
});
