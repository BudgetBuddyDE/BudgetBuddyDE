import 'express';
import type { RequestContext } from './src/types';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    context: RequestContext;
  }
}
