import {z} from 'zod';
import {getAuth} from '../../../lib/auth';
import {BackendConfig, invalidConfigFields} from '../../../lib/config';
import {logger} from '../../../lib/logger';

const authLogger = logger.child({module: 'auth'});

/** Requires valid auth configuration and dependencies before handling the request. */
function requireAuthConfig() {
  try {
    const config = BackendConfig.getInstance();
    const auth = config.auth;
    // Validate before handling CORS or initializing Better Auth.
    void config.database;
    void config.email;
    void config.redis.auth;
    return auth;
  } catch (error) {
    if (!(error instanceof z.ZodError)) throw error;
    authLogger.error('Invalid auth configuration', {fields: invalidConfigFields(error)});
    throw createError({statusCode: 503, statusMessage: 'Authentication unavailable'});
  }
}

/** Validates the request origin, handles CORS preflight, and delegates the request to Better Auth. */
export default defineEventHandler(event => {
  const {baseUrl, trustedOrigins} = requireAuthConfig();
  const origin = getHeader(event, 'origin');
  if (origin && origin !== baseUrl && !trustedOrigins.includes(origin)) {
    throw createError({statusCode: 403, statusMessage: 'Untrusted origin'});
  }
  if (
    handleCors(event, {
      origin: [...trustedOrigins],
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
    })
  )
    return;
  return getAuth().handler(toWebRequest(event));
});
