import 'express';

import {User} from './src/models/User.model';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: ReturnType<typeof crypto.randomUUID>;
    user?: User | null;
  }
}
