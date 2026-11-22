import redisDriver from 'unstorage/drivers/redis';
import {config} from '../lib/config';
import {pool} from '../lib/database';

export default defineNitroPlugin(app => {
  const storage = useStorage();
  function mount(name: string, url: string | undefined, db: number) {
    if (!url) return;
    storage.mount(name, redisDriver({url, db, connectTimeout: 5000, commandTimeout: 5000, maxRetriesPerRequest: 1}));
    app.hooks.hook('close', () => storage.unmount(name));
  }
  mount('auth', config.AUTH_REDIS_URL, config.AUTH_REDIS_DB);
  mount('kv', config.REDIS_URL, config.REDIS_DB);
  app.hooks.hook('close', () => pool.end());
});
