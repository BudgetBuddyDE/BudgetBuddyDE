import {z} from 'zod';
import {getAuth} from '../../../lib/auth';
import {getConfig, invalidConfigFields} from '../../../lib/config';
import {logger} from '../../../lib/logger';

const authLogger = logger.child({module: 'auth'});

function requireAuthConfig() {
  try {
    return getConfig();
  } catch (error) {
    if (!(error instanceof z.ZodError)) throw error;
    authLogger.error('Invalid auth configuration', {fields: invalidConfigFields(error)});
    throw createError({statusCode: 503, statusMessage: 'Authentication unavailable'});
  }
}

export default defineEventHandler(event => {
  const config = requireAuthConfig();
  const origin = getHeader(event, 'origin');
  if (origin && origin !== config.BASE_URL && !config.TRUSTED_ORIGINS.includes(origin)) {
    throw createError({statusCode: 403, statusMessage: 'Untrusted origin'});
  }
  if (
    handleCors(event, {
      origin: config.TRUSTED_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
    })
  )
    return;
  return getAuth().handler(toWebRequest(event));
});
