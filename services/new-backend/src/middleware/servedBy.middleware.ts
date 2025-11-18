import type {NextFunction, Request, Response} from 'express';

import {config} from '../config';

export function servedBy(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Served-By', `${config.service}::${config.version}`);
  next();
}
