import {auth} from '../../../lib/auth';
import {config} from '../../../lib/config';

export default defineEventHandler(event => {
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
  return auth.handler(toWebRequest(event));
});
