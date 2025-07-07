import cds from '@sap/cds';
import { type NextFunction, type Request, type Response } from 'express';

import { authClient } from './authClient';

type Req = Request & { user: cds.User; tenant: string; requestId: string };

export default async function auth(req: Req, _res: Response, next: NextFunction) {
  req.requestId = cds.utils.uuid();
  console.log('Authentication middleware started', {
    requestId: req.requestId,
  });
  let logOptions = {
    requestId: req.requestId,
    baseUrl: req.baseUrl,
    path: req.path,
    user: req.user,
    method: req.method,
  };

  try {
    try {
      const session = await authClient.getSession(undefined, {
        headers: new Headers(req.headers as HeadersInit),
      });
      console.log('Session data:', session);

      if (!session) {
        console.log('No session found', logOptions);
        return next(new Error('No session found'));
      }

      req.user = new cds.User({
        id: 'user.id',
        // roles: 'role' in user ? [user.role as string] : [],
        roles: [],
        attr: {
          userId: 'user.id',
          name: 'user.name',
          email: 'user.email',
        },
      });

      //   const headers = new Headers();
      //   if (req.headers.authorization) {
      //     // If the request has an authorization header, we use it to get the session
      //     headers.set('Authorization', req.headers.authorization);
      //   } else if (req.headers['set-auth-token']) {
      //     // If the request has a set-auth-token header, we use it to get the session
      //     headers.set('Authorization', `Bearer ${req.headers['set-auth-token']}`);
      //   } else if (req.headers.cookie) {
      //     // If the request has a cookie header, we use it to get the session
      //     headers.set('Cookie', req.headers.cookie);
      //   }
      //   data = await authHelper.getSession({ headers: headers });
    } catch (error) {
      return next(error);
    }

    // const sessionUser = data.user;
    // const internalUser = await authHelper.getBackendUser(sessionUser.id);
    // authLogger.debug('Found replicated user', internalUser, logOptions);

    // req.user = authHelper.mapToUserObj(sessionUser);
  } catch (err) {
    console.error('Unexpected error in authentication', err, logOptions);
    return next(err);
  }

  return next();
}
