import redisDriver from 'unstorage/drivers/redis';
import {z} from 'zod';
import {BackendConfig, invalidConfigFields} from '../lib/config';
import {closeDatabase} from '../lib/database';
import {logger} from '../lib/logger';

export default defineNitroPlugin(app => {
  const storage = useStorage();
  const {redis} = BackendConfig.getInstance();
  for (const name of ['auth', 'kv'] as const) {
    try {
      const connection = redis[name];
      if (!connection) continue;
      storage.mount(name, redisDriver({...connection, ...redis.options}));
      app.hooks.hook('close', () => storage.unmount(name));
    } catch (error) {
      if (!(error instanceof z.ZodError)) throw error;
      logger.error('Invalid Redis configuration', {module: 'storage', mount: name, fields: invalidConfigFields(error)});
    }
  }
  app.hooks.hook('close', closeDatabase);
});
