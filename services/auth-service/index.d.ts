import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: ReturnType<typeof crypto.randomUUID>;
  }
}
