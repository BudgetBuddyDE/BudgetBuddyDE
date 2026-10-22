import type {RequestContext} from './RequestContext';

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

export {};
