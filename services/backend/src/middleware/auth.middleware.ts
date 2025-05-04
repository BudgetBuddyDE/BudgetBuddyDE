import {type NextFunction, type Request, type Response} from 'express';

import {AuthRole} from '../auth';
import {logger} from '../core/logger';
import {User} from '../models/User.model';

const authLogger = logger.child({label: 'auth'});
export function auth(req: Request, _res: Response, next: NextFunction) {
  req.user = User.builder()
    .withId('YtIFh3GqktLaCmu5PqlLAdQc3JeEohIf')
    .withName('John Doe')
    .withEmail('john.doe@budget-buddy.de')
    .withRole(AuthRole.ADMIN)
    .build();
  authLogger.debug('[MOCKED] User %s (%s) is authenticated', req.user.name, req.user.id);

  next();
}
