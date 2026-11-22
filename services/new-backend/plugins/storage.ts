import redisDriver from 'unstorage/drivers/redis';
import {authRedisSchema, invalidConfigFields, kvRedisSchema, readRedisEnv} from '../lib/config';
import {closeDatabase} from '../lib/database';
import {logger} from '../lib/logger';

export default defineNitroPlugin(app => {
  const storage = useStorage();
  function mount(name: string, url: string | undefined, db: number) {
    if (!url) return;
    storage.mount(name, redisDriver({url, db, connectTimeout: 5000, commandTimeout: 5000, maxRetriesPerRequest: 1}));
    app.hooks.hook('close', () => storage.unmount(name));
  }
  const env = readRedisEnv(process.env);
  const auth = authRedisSchema.safeParse(env);
  const kv = kvRedisSchema.safeParse(env);
  if (auth.success) mount('auth', auth.data.AUTH_REDIS_URL, auth.data.AUTH_REDIS_DB);
  if (kv.success) mount('kv', kv.data.REDIS_URL, kv.data.REDIS_DB);
  else logger.error('Invalid Redis configuration', {module: 'storage', fields: invalidConfigFields(kv.error)});
  app.hooks.hook('close', closeDatabase);
});
