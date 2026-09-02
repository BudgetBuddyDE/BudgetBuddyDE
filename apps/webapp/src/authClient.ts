import {apiKeyClient} from '@better-auth/api-key/client';
import {createAuthClient} from 'better-auth/react';
import {redirect} from 'next/navigation';
import {webappConfig} from './config';
import {logger} from './logger';

export const authClient = createAuthClient({
  baseURL: webappConfig.authServiceHost,
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        logger.warn('Auth service rate limit reached', {status: e.error.status});
      } else logger.error('Auth service request failed', {status: e.error.status});
    },
  },
  plugins: [apiKeyClient()],
});

export const signOut = (onSuccess?: () => void, onError?: () => void) =>
  authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        logger.info('User signed out successfully! Redirecting to sign-in page...');
        onSuccess?.();
        window.location.assign('/sign-in');
      },
      onError: _ctx => {
        logger.error('Sign-out request failed');
        onError?.();
      },
    },
  });

export const revalidateSession = (onSuccess?: () => void, onError?: () => void) =>
  authClient.getSession({
    fetchOptions: {
      onSuccess(context) {
        if (context.response.status === 401 || !context.data) {
          logger.info('Session is invalid, redirecting to sign-in page...');
          onError?.();
          redirect('/sign-in');
        }

        logger.info('Session revalidated successfully', {status: context.response.status});
        onSuccess?.();
      },
      onError() {
        logger.error('Error revalidating session');
        onError?.();
      },
    },
  });
