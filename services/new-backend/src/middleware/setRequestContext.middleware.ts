import {randomUUID} from 'node:crypto';
import type {NextFunction, Request, Response} from 'express';

import type {RequestContext} from '../types';

export function setRequestContext(req: Request, res: Response, next: NextFunction): void {
  const context: RequestContext = {
    requestId: randomUUID(),
    user: {
      id: 'demo',
      name: 'Demo User',
      email: 'demo@example.com',
      emailVerified: true,
      updatedAt: new Date(),
      createdAt: new Date(),
    },
    session: null,
  };

  req.context = context;
  req.requestId = context.requestId;
  res.locals.context = context;

  next();
}
