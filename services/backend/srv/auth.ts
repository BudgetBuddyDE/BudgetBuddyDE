import cds from '@sap/cds';
import {type NextFunction, type Request, type Response} from 'express';

import {config} from './core/config';
import {type TSession, type TUser} from './types';
import {type Nullable} from './types/utility';
import {AuthHelper} from './utils';

const authLogger = config.getLogger('auth', {label: 'auth'});

type Req = Request & {user: cds.User; tenant: string; requestId: string};

export default async function custom_auth(req: Req, _res: Response, next: NextFunction) {
  req.requestId = cds.utils.uuid();
  let logOptions = {requestId: req.requestId, baseUrl: req.baseUrl, path: req.path, user: req.user, method: req.method};

  // This section prevents unauthorized users from creating entries in the backend user table.
  // The user table serves as a central reference for managing relationships with other database tables.
  // if (`${req.baseUrl}${req.path}` === '/service/user/User' && req.method === 'POST') {
  //   authLogger.warn('Skipping authentication for internal user creation', logOptions);
  //   // FIXME: This is a workaround to allow internal user creation
  //   req.user = new cds.User({
  //     id: 'internal',
  //     roles: ['system'],
  //     attr: {},
  //   });
  //   return next();
  // }

  const authHelper = new AuthHelper();
  try {
    let data: Nullable<{session: TSession; user: TUser}> = null;
    try {
      const headers = new Headers();
      if (req.headers.authorization) {
        // If the request has an authorization header, we use it to get the session
        headers.set('Authorization', req.headers.authorization);
      } else if (req.headers['set-auth-token']) {
        // If the request has a set-auth-token header, we use it to get the session
        headers.set('Authorization', `Bearer ${req.headers['set-auth-token']}`);
      } else if (req.headers.cookie) {
        // If the request has a cookie header, we use it to get the session
        headers.set('Cookie', req.headers.cookie);
      }
      data = await authHelper.getSession({headers: headers});
    } catch (error) {
      return next(error);
    }

    const sessionUser = data.user;
    const internalUser = await authHelper.getBackendUser(sessionUser.id);
    authLogger.debug('Found replicated user', internalUser, logOptions);

    req.user = authHelper.mapToUserObj(sessionUser);
  } catch (err) {
    authLogger.error('Unexpected error in authentication', {err}, logOptions);
    return next(err);
  }

  return next();
}
