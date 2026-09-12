import type {AddressInfo} from 'node:net';
import express, {type Router} from 'express';
import type {RequestContext} from '../types';

export async function requestRouter(
  router: Router,
  userId: string,
  path: string,
  options: {method: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown},
): Promise<{status: number; body: unknown}> {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.context = {
      user: {id: userId} as RequestContext['user'],
      session: null,
    };
    next();
  });
  app.use(router);

  const server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const {port} = server.address() as AddressInfo;

  try {
    const isFormData = options.body instanceof FormData;
    const body =
      options.body === undefined ? undefined : isFormData ? (options.body as FormData) : JSON.stringify(options.body);
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: options.method,
      headers: options.body === undefined || isFormData ? undefined : {'content-type': 'application/json'},
      body,
    });

    return {status: response.status, body: await response.json()};
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
  }
}
