import 'express';
import type {RequestContext} from './src/types';

declare module 'express-serve-static-core' {
  interface Request {
    context: RequestContext;
  }
}
